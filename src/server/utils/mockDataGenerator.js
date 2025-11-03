const {
  storeNewsArticlesBatch,
  storeHourlyMetrics,
  storeAnomaly,
  storeSource
} = require('../services/supabase');

/**
 * Generate mock news articles with various anomaly types
 */
function generateMockArticles() {
  const now = new Date();
  const articles = [];

  // Normal articles (baseline)
  const sentimentLabels = ['positive', 'neutral', 'negative'];
  const sentimentWeights = [0.3, 0.5, 0.2]; // 30% positive, 50% neutral, 20% negative
  
  for (let i = 0; i < 30; i++) {
    // Weighted random sentiment
    const rand = Math.random();
    let sentimentLabel;
    if (rand < sentimentWeights[0]) {
      sentimentLabel = 'positive';
    } else if (rand < sentimentWeights[0] + sentimentWeights[1]) {
      sentimentLabel = 'neutral';
    } else {
      sentimentLabel = 'negative';
    }
    
    // Generate sentiment score based on label
    let sentimentScore;
    if (sentimentLabel === 'positive') {
      sentimentScore = 0.1 + Math.random() * 0.9; // 0.1 to 1.0
    } else if (sentimentLabel === 'negative') {
      sentimentScore = -1.0 + Math.random() * 0.9; // -1.0 to -0.1
    } else {
      sentimentScore = -0.1 + Math.random() * 0.2; // -0.1 to 0.1
    }
    
    articles.push({
      id: `normal_article_${i}`,
      title: `Regular News Article ${i + 1}`,
      description: `This is a normal news article with standard content about current events.`,
      content: `Full content of regular news article ${i + 1}. This represents typical news coverage.`,
      url: `https://example.com/news/${i}`,
      source: ['CNN', 'BBC', 'Reuters', 'AP News'][Math.floor(Math.random() * 4)],
      author: `Reporter ${i + 1}`,
      publishedAt: new Date(now - (i * 10 * 60 * 1000)).toISOString(),
      urlToImage: null,
      sentiment_score: sentimentScore,
      sentiment_label: sentimentLabel,
      topic_tags: ['politics', 'economy', 'technology'],
      is_anomaly: false,
      anomaly_reasons: []
    });
  }

  // ANOMALY TYPE 1: Volume Spike - Unusually high number of articles from one source
  articles.push({
    id: 'volume_spike_1',
    title: 'Breaking: Major Economic Policy Announcement',
    description: 'Government announces unprecedented economic measures affecting millions.',
    content: 'Full story about major policy change...',
    url: 'https://example.com/news/volume1',
    source: 'CNN', // This source will dominate
    author: 'Breaking News Team',
    publishedAt: new Date(now - 30 * 60 * 1000).toISOString(),
    urlToImage: null,
    sentiment_score: -0.5,
    sentiment_label: 'negative',
    topic_tags: ['economy', 'politics', 'breaking'],
    is_anomaly: true,
    anomaly_reasons: ['volume_spike', 'source_dominance']
  });

  // Add 10 more articles from same source (volume spike)
  for (let i = 0; i < 10; i++) {
    const sentimentRand = Math.random();
    const sentimentLabel = sentimentRand < 0.6 ? 'negative' : (sentimentRand < 0.8 ? 'neutral' : 'positive');
    const sentimentScore = sentimentLabel === 'negative' ? (-0.8 + Math.random() * 0.3) :
                           sentimentLabel === 'positive' ? (0.1 + Math.random() * 0.4) :
                           (-0.1 + Math.random() * 0.2);
    
    articles.push({
      id: `volume_spike_${i + 2}`,
      title: `Breaking Update ${i + 2}: Economic Policy Details`,
      description: `Follow-up story ${i + 2} about the economic announcement.`,
      content: `Detailed coverage of economic policy updates...`,
      url: `https://example.com/news/volume${i + 2}`,
      source: 'CNN', // Same source - creates dominance
      author: 'Economic Reporter',
      publishedAt: new Date(now - (30 - i) * 60 * 1000).toISOString(),
      urlToImage: null,
      sentiment_score: sentimentScore,
      sentiment_label: sentimentLabel,
      topic_tags: ['economy', 'breaking'],
      is_anomaly: true,
      anomaly_reasons: ['volume_spike', 'source_dominance']
    });
  }

  // ANOMALY TYPE 2: Sentiment Shift - Sudden negative sentiment spike
  articles.push({
    id: 'sentiment_shift_1',
    title: 'Crisis Escalates: Market Crash Triggers Panic',
    description: 'Stock markets plummet as investors react to negative news.',
    content: 'Market analysis showing severe downturn...',
    url: 'https://example.com/news/sentiment1',
    source: 'Reuters',
    author: 'Financial Reporter',
    publishedAt: new Date(now - 45 * 60 * 1000).toISOString(),
    urlToImage: null,
    sentiment_score: -0.85, // Very negative - anomaly
    sentiment_label: 'negative',
    topic_tags: ['economy', 'finance', 'crisis'],
    is_anomaly: true,
    anomaly_reasons: ['sentiment_shift']
  });

  articles.push({
    id: 'sentiment_shift_2',
    title: 'Disaster Strikes: Massive Infrastructure Failure',
    description: 'Critical infrastructure system fails, causing widespread disruption.',
    content: 'Detailed report on infrastructure failure...',
    url: 'https://example.com/news/sentiment2',
    source: 'BBC',
    author: 'Infrastructure Reporter',
    publishedAt: new Date(now - 50 * 60 * 1000).toISOString(),
    urlToImage: null,
    sentiment_score: -0.75, // Very negative
    sentiment_label: 'negative',
    topic_tags: ['infrastructure', 'crisis', 'breaking'],
    is_anomaly: true,
    anomaly_reasons: ['sentiment_shift']
  });

  // ANOMALY TYPE 3: Duplicate Content - Similar articles from different sources
  const duplicateTitle = 'Tech Giant Announces Revolutionary New Product';
  articles.push({
    id: 'duplicate_1',
    title: duplicateTitle,
    description: 'Major technology company reveals groundbreaking innovation.',
    content: 'Details about the new product announcement...',
    url: 'https://example.com/news/dup1',
    source: 'AP News',
    author: 'Tech Reporter A',
    publishedAt: new Date(now - 60 * 60 * 1000).toISOString(),
    urlToImage: null,
    sentiment_score: 0.6,
    sentiment_label: 'positive',
    topic_tags: ['technology', 'innovation'],
    is_anomaly: true,
    anomaly_reasons: ['duplicate_content']
  });

  articles.push({
    id: 'duplicate_2',
    title: duplicateTitle, // Same title - duplicate
    description: 'Tech company unveils innovative new solution.',
    content: 'Coverage of the product launch...',
    url: 'https://example.com/news/dup2',
    source: 'Reuters',
    author: 'Tech Reporter B',
    publishedAt: new Date(now - 61 * 60 * 1000).toISOString(),
    urlToImage: null,
    sentiment_score: 0.55,
    sentiment_label: 'positive',
    topic_tags: ['technology', 'innovation'],
    is_anomaly: true,
    anomaly_reasons: ['duplicate_content']
  });

  articles.push({
    id: 'duplicate_3',
    title: 'Tech Giant Announces Revolutionary New Product Launch', // Very similar
    description: 'Major tech firm introduces groundbreaking innovation.',
    content: 'Story about new product announcement...',
    url: 'https://example.com/news/dup3',
    source: 'CNN',
    author: 'Tech Reporter C',
    publishedAt: new Date(now - 62 * 60 * 1000).toISOString(),
    urlToImage: null,
    sentiment_score: 0.58,
    sentiment_label: 'positive',
    topic_tags: ['technology', 'innovation'],
    is_anomaly: true,
    anomaly_reasons: ['duplicate_content']
  });

  return articles;
}

/**
 * Generate mock anomalies
 */
function generateMockAnomalies() {
  const now = new Date();
  const anomalies = [];

  // Volume Spike Anomaly
  anomalies.push({
    anomaly_type: 'volume_spike',
    severity_score: 3.5,
    detected_at: new Date(now - 30 * 60 * 1000).toISOString(),
    related_article_id: 'volume_spike_1',
    related_hour: getCurrentHourKey(),
    explanation: 'Volume spike detected: 11 articles from CNN in the last hour (average: 7-8 articles per hour)',
    metadata: {
      current_volume: 11,
      average_volume: 7.5,
      z_score: 2.8,
      dominant_source: 'CNN'
    },
    status: 'new'
  });

  // Sentiment Shift Anomaly
  anomalies.push({
    anomaly_type: 'sentiment_shift',
    severity_score: 4.2,
    detected_at: new Date(now - 45 * 60 * 1000).toISOString(),
    related_article_id: 'sentiment_shift_1',
    related_hour: getCurrentHourKey(),
    explanation: 'Sentiment shift detected: Negative sentiment spike (-0.85 vs 0.05 average). Multiple crisis-related articles.',
    metadata: {
      current_sentiment: -0.85,
      average_sentiment: 0.05,
      z_score: 3.2,
      direction: 'negative'
    },
    status: 'new'
  });

  // Source Dominance Anomaly
  anomalies.push({
    anomaly_type: 'source_dominance',
    severity_score: 2.8,
    detected_at: new Date(now - 30 * 60 * 1000).toISOString(),
    related_article_id: null,
    related_hour: getCurrentHourKey(),
    explanation: 'Source dominance: CNN accounts for 52% of articles in the last hour (threshold: 50%)',
    metadata: {
      dominant_source: 'CNN',
      ratio: 0.52,
      count: 11,
      total: 21
    },
    status: 'new'
  });

  // Duplicate Content Anomaly
  anomalies.push({
    anomaly_type: 'duplicate_content',
    severity_score: 2.1,
    detected_at: new Date(now - 60 * 60 * 1000).toISOString(),
    related_article_id: 'duplicate_1',
    related_hour: getCurrentHourKey(),
    explanation: 'Duplicate content detected: 3 groups of similar articles about the same topic',
    metadata: {
      duplicate_groups: 1,
      total_duplicates: 3,
      similarity_score: 0.85
    },
    status: 'new'
  });

  return anomalies;
}

/**
 * Generate mock hourly metrics
 */
function generateMockHourlyMetrics() {
  const metrics = [];
  const now = new Date();
  
  // Generate metrics for last 24 hours
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now - i * 60 * 60 * 1000);
    const hourKey = `${hour.getFullYear()}-${String(hour.getMonth() + 1).padStart(2, '0')}-${String(hour.getDate()).padStart(2, '0')}-${String(hour.getHours()).padStart(2, '0')}`;
    
    // Most hours have normal volume (20-30 articles)
    let volume = 20 + Math.floor(Math.random() * 10);
    let avgSentiment = 0.05 + (Math.random() * 0.3 - 0.15); // Slightly positive to neutral
    
    // Current hour has spike
    if (i === 0) {
      volume = 45; // Volume spike
      avgSentiment = -0.4; // Negative sentiment shift
    }

    metrics.push({
      hour: hourKey,
      timestamp: hour.toISOString(),
      volume: volume,
      avg_sentiment: avgSentiment,
      top_topics: ['politics', 'economy', 'technology', 'sports'],
      anomalies_detected: i === 0 ? 4 : 0,
      sources_count: 5,
      positive_count: Math.floor(volume * 0.4),
      neutral_count: Math.floor(volume * 0.4),
      negative_count: Math.floor(volume * 0.2),
      updated_at: hour.toISOString()
    });
  }

  return metrics;
}

/**
 * Get current hour key in format: YYYY-MM-DD-HH
 */
function getCurrentHourKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
}

/**
 * Populate database with mock data
 */
async function populateMockData() {
  try {
    console.log('Generating mock data...');
    
    const articles = generateMockArticles();
    const anomalies = generateMockAnomalies();
    const metrics = generateMockHourlyMetrics();

    console.log(`Generated ${articles.length} articles, ${anomalies.length} anomalies, ${metrics.length} hourly metrics`);

    // Store articles
    console.log('Storing articles...');
    await storeNewsArticlesBatch(articles);
    console.log('✓ Articles stored');

    // Store anomalies
    console.log('Storing anomalies...');
    for (const anomaly of anomalies) {
      await storeAnomaly(anomaly);
    }
    console.log('✓ Anomalies stored');

    // Store hourly metrics
    console.log('Storing hourly metrics...');
    for (const metric of metrics) {
      await storeHourlyMetrics(metric);
    }
    console.log('✓ Hourly metrics stored');

    // Store sources
    console.log('Storing sources...');
    const sources = ['CNN', 'BBC', 'Reuters', 'AP News'];
    for (const source of sources) {
      await storeSource({
        name: source,
        credibility_score: 0.8 + Math.random() * 0.2,
        article_count: articles.filter(a => a.source === source).length,
        metadata: {}
      });
    }
    console.log('✓ Sources stored');

    console.log('\n✅ Mock data population completed!');
    console.log('\nAnomaly Types Created:');
    console.log('1. Volume Spike: 11 articles from CNN in one hour');
    console.log('2. Sentiment Shift: Negative sentiment articles (-0.85)');
    console.log('3. Source Dominance: CNN accounts for 52% of articles');
    console.log('4. Duplicate Content: 3 similar articles about same topic');

    return {
      articles: articles.length,
      anomalies: anomalies.length,
      metrics: metrics.length,
      sources: sources.length
    };
  } catch (error) {
    console.error('Error populating mock data:', error);
    throw error;
  }
}

module.exports = {
  generateMockArticles,
  generateMockAnomalies,
  generateMockHourlyMetrics,
  populateMockData
};

