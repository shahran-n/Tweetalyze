const cron = require('node-cron');
const { fetchTopHeadlines, normalizeArticle } = require('../services/newsApi');
const { detectAnomalies } = require('../services/anomalyDetection');
const { analyzeSentiment } = require('../services/openai');
const {
  storeNewsArticlesBatch,
  storeHourlyMetrics,
  storeAnomaly,
  storeSource,
  getHourlyMetrics,
  getRecentNews
} = require('../services/supabase');

/**
 * Process and store news articles with anomaly detection
 */
async function ingestNews() {
  try {
    console.log(`[${new Date().toISOString()}] Starting news ingestion...`);

    // Fetch top headlines from News API
    const { articles: rawArticles } = await fetchTopHeadlines({
      country: 'us',
      pageSize: 100
    });

    if (!rawArticles || rawArticles.length === 0) {
      console.log('No articles fetched from News API');
      return;
    }

    console.log(`Fetched ${rawArticles.length} articles from News API`);

    // Normalize articles
    let articles = rawArticles.map(normalizeArticle);

    // Analyze sentiment using GPT for each article
    console.log('Analyzing sentiment for articles using GPT...');
    for (let i = 0; i < articles.length; i++) {
      try {
        const article = articles[i];
        const sentimentResult = await analyzeSentiment(article.title || '', article.description || '');
        articles[i].sentiment_score = sentimentResult.score;
        articles[i].sentiment_label = sentimentResult.sentiment; // Store label for categorization
      } catch (error) {
        console.error(`Error analyzing sentiment for article ${i}:`, error);
        // Fallback to neutral
        articles[i].sentiment_score = 0;
        articles[i].sentiment_label = 'neutral';
      }
      // Add small delay to avoid rate limits
      if (i < articles.length - 1 && i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Get historical metrics for anomaly detection
    const historicalMetrics = await getHistoricalMetrics();

    // Detect anomalies (but exclude sentiment calculation since we already did it)
    const anomalies = await detectAnomalies(articles, historicalMetrics);

    console.log(`Detected ${anomalies.length} anomalies`);

    // Store anomalies
    for (const anomaly of anomalies) {
      try {
        await storeAnomaly({
          ...anomaly,
          severity_score: anomaly.severity || 0
        });
      } catch (error) {
        console.error('Error storing anomaly:', error);
      }
    }

    // Store articles in batch
    const storedArticles = await storeNewsArticlesBatch(articles);
    console.log(`Stored ${storedArticles?.length || 0} articles`);

    // Update source counts
    const sourceCounts = {};
    articles.forEach(article => {
      const sourceName = article.source || 'Unknown';
      sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
    });

    for (const [sourceName, count] of Object.entries(sourceCounts)) {
      try {
        // Get existing source data by fetching from sources table
        // For now, just update with current count (can be enhanced later)
        const { getAllSources } = require('../services/supabase');
        const allSources = await getAllSources().catch(() => []);
        const existingSource = allSources.find(s => s.name === sourceName);
        const existingCount = existingSource?.article_count || 0;

        await storeSource({
          name: sourceName,
          article_count: existingCount + count,
          metadata: { last_ingestion: new Date().toISOString() }
        });
      } catch (error) {
        console.error(`Error storing source ${sourceName}:`, error);
      }
    }

    // Calculate and store hourly metrics
    const sentiments = articles.map(a => a.sentiment_score || 0);
    const avgSentiment = sentiments.length > 0 
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
      : null;

    // Count sentiment categories using GPT labels (more accurate)
    const positiveCount = articles.filter(a => 
      a.sentiment_label === 'positive' || (a.sentiment_score && a.sentiment_score > 0.1)
    ).length;
    const neutralCount = articles.filter(a => 
      a.sentiment_label === 'neutral' || (a.sentiment_score && a.sentiment_score >= -0.1 && a.sentiment_score <= 0.1)
    ).length;
    const negativeCount = articles.filter(a => 
      a.sentiment_label === 'negative' || (a.sentiment_score && a.sentiment_score < -0.1)
    ).length;

    // Extract topics (simplified - just use keywords from titles)
    const allWords = articles
      .map(a => (a.title || '').toLowerCase())
      .join(' ')
      .match(/\b\w{4,}\b/g) || [];

    const wordCounts = {};
    allWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const topTopics = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    const uniqueSources = new Set(articles.map(a => a.source || 'Unknown')).size;

    await storeHourlyMetrics({
      volume: articles.length,
      avg_sentiment: avgSentiment,
      top_topics: topTopics,
      anomalies_detected: anomalies.length,
      sources_count: uniqueSources,
      positive_count: positiveCount,
      neutral_count: neutralCount,
      negative_count: negativeCount
    });

    console.log(`[${new Date().toISOString()}] News ingestion completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in news ingestion:`, error);
  }
}

/**
 * Get historical metrics for anomaly detection
 */
async function getHistoricalMetrics() {
  try {
    // Get last 24 hours of hourly metrics
    const hourlyMetrics = await getHourlyMetrics({ hours: 24 });

    if (!hourlyMetrics || hourlyMetrics.length === 0) {
      return {
        volumes: [],
        sentiments: []
      };
    }

    const volumes = hourlyMetrics.map(m => m.volume || 0);
    const sentiments = hourlyMetrics
      .map(m => m.avg_sentiment)
      .filter(s => s !== null && s !== undefined);

    return {
      volumes,
      sentiments
    };
  } catch (error) {
    console.error('Error getting historical metrics:', error);
    return {
      volumes: [],
      sentiments: []
    };
  }
}

/**
 * Start the scheduled news ingestion
 * Runs every 15 minutes by default
 */
function startNewsIngestion(cronSchedule = '*/15 * * * *') {
  console.log(`Starting news ingestion scheduler with schedule: ${cronSchedule}`);
  
  // Run immediately on start
  ingestNews();

  // Schedule periodic ingestion
  cron.schedule(cronSchedule, () => {
    ingestNews();
  });
}

module.exports = {
  ingestNews,
  startNewsIngestion
};

