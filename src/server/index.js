const express = require('express');
const os = require('os');
const fetch = require('node-fetch');
require('dotenv').config();

// Import services
const { generateTweet, generateTweetVariations } = require('./services/openai');
const { startNewsIngestion } = require('./workers/newsIngester');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('dist'));

app.get('/api/getUsername', (req, res) => res.send({ username: os.userInfo().username }));

// Enhanced cache with longer TTL and better logging
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // Increased to 15 minutes

// Track rate limit info
let rateLimitInfo = {
  remaining: null,
  reset: null,
  limit: null
};

async function fetchJson(url, token) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  
  // Capture rate limit headers
  rateLimitInfo = {
    remaining: r.headers.get('x-rate-limit-remaining'),
    reset: r.headers.get('x-rate-limit-reset'),
    limit: r.headers.get('x-rate-limit-limit')
  };
  
  console.log('Rate Limit Info:', rateLimitInfo);
  
  const json = await r.json();
  if (!r.ok) {
    const message = json && (json.title || json.error || json.message || JSON.stringify(json));
    const err = new Error(message || 'Request failed');
    err.status = r.status;
    err.rateLimitInfo = rateLimitInfo;
    throw err;
  }
  return json;
}

// GET /api/search?q=...
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }
  
  // Add caching for search queries too
  const cacheKey = `search:${query}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    console.log('Returning cached search results for:', query);
    return res.json(cached.data);
  }
  
  const token = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server is not configured with X_BEARER_TOKEN' });
  }
  
  try {
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.set('query', query);
    url.searchParams.set('tweet.fields', 'id,text,created_at,public_metrics,lang');
    url.searchParams.set('expansions', 'author_id');
    url.searchParams.set('user.fields', 'id,name,username,public_metrics,verified');
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data });
    }
    
    // Cache the search results
    cache.set(cacheKey, { ts: now, data });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/user-analytics?handle=jack
app.get('/api/user-analytics', async (req, res) => {
  const handleRaw = (req.query.handle || '').trim();
  if (!handleRaw) return res.status(400).json({ error: 'Missing handle' });
  const handle = handleRaw.replace(/^@/, '');
  const token = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) return res.status(500).json({ error: 'Server is not configured with X_BEARER_TOKEN' });

  const cacheKey = `ua:${handle}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    console.log('Returning cached analytics for:', handle);
    return res.json(cached.data);
  }

  try {
    // 1) User profile
    const user = await fetchJson(`https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=public_metrics,created_at,verified,description,location,profile_image_url`, token);

    const userId = user && user.data && user.data.id;
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // 2) Recent tweets for frequency estimate
    const tweets = await fetchJson(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics,entities,attachments&expansions=attachments.media_keys&media.fields=type`, token);

    const tweetList = Array.isArray(tweets.data) ? tweets.data : [];
    let tweetsPerDay = 0;
    if (tweetList.length >= 2) {
      const times = tweetList.map(t => new Date(t.created_at).getTime());
      const max = Math.max(...times);
      const min = Math.min(...times);
      const days = Math.max(1, (max - min) / (1000 * 60 * 60 * 24));
      tweetsPerDay = Number((tweetList.length / days).toFixed(2));
    } else if (tweetList.length === 1) {
      tweetsPerDay = 1;
    }

    // Calculate analytics from tweets
    const totalLikes = tweetList.reduce((sum, t) => sum + ((t.public_metrics && t.public_metrics.like_count) || 0), 0);
    const totalRetweets = tweetList.reduce((sum, t) => sum + ((t.public_metrics && t.public_metrics.retweet_count) || 0), 0);
    const avgLength = tweetList.length > 0 ? Math.round(tweetList.reduce((sum, t) => sum + (t.text ? t.text.length : 0), 0) / tweetList.length) : 0;
    
    // Analyze media types
    const mediaBreakdown = {
      photo: 0,
      video: 0,
      gif: 0,
      link: 0,
      text_only: 0
    };
    
    const mediaMap = {};
    if (tweets.includes && tweets.includes.media) {
      tweets.includes.media.forEach(m => {
        mediaMap[m.media_key] = m.type;
      });
    }
    
    tweetList.forEach(t => {
      let hasMedia = false;
      if (t.attachments && t.attachments.media_keys) {
        hasMedia = true;
        t.attachments.media_keys.forEach(key => {
          const type = mediaMap[key];
          if (type === 'photo') mediaBreakdown.photo++;
          else if (type === 'video') mediaBreakdown.video++;
          else if (type === 'animated_gif') mediaBreakdown.gif++;
        });
      }
      if (t.entities && t.entities.urls && t.entities.urls.length > 0) {
        hasMedia = true;
        mediaBreakdown.link++;
      }
      if (!hasMedia) {
        mediaBreakdown.text_only++;
      }
    });
    
    // Extract words for word cloud
    const allWords = tweetList
      .map(t => t.text || '')
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'http', 'https', 'com'].includes(w));
    
    const wordCounts = {};
    allWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    const metrics = user.data.public_metrics || {};
    const payload = {
      user: {
        id: user.data.id,
        name: user.data.name,
        username: user.data.username,
        verified: user.data.verified,
        description: user.data.description,
        location: user.data.location,
        profile_image_url: user.data.profile_image_url,
        followers: metrics.followers_count,
        following: metrics.following_count,
        tweet_count: metrics.tweet_count,
        listed_count: metrics.listed_count
      },
      analytics: {
        tweets_per_day: tweetsPerDay,
        recent_sample_size: tweetList.length,
        likes: totalLikes,
        retweets: totalRetweets,
        avg_tweet_length: avgLength,
        unique_words: Object.keys(wordCounts).length,
        top_words: topWords,
        media_breakdown: mediaBreakdown
      },
      data: tweetList,
      rateLimitInfo
    };

    cache.set(cacheKey, { ts: now, data: payload });
    console.log('Cached new analytics for:', handle);
    return res.json(payload);
  } catch (e) {
    const status = e.status || 500;
    console.error('Error fetching analytics:', e.message, e.rateLimitInfo);
    
    // Return rate limit info in error response
    return res.status(status).json({ 
      error: e.message || 'Failed to fetch analytics',
      rateLimitInfo: e.rateLimitInfo
    });
  }
});

// New endpoint to check rate limit status
app.get('/api/rate-limit-status', (req, res) => {
  const resetTime = rateLimitInfo.reset ? new Date(rateLimitInfo.reset * 1000) : null;
  const now = new Date();
  const minutesUntilReset = resetTime ? Math.ceil((resetTime - now) / 1000 / 60) : null;
  
  res.json({
    ...rateLimitInfo,
    resetTime,
    minutesUntilReset,
    cacheSize: cache.size
  });
});

// Endpoint to clear cache (useful for testing)
app.post('/api/clear-cache', (req, res) => {
  cache.clear();
  res.json({ success: true, message: 'Cache cleared' });
});

// ==================== Tweet Generation Endpoints ====================

// Generate a tweet
app.post('/api/tweets/generate', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const tweet = await generateTweet(prompt, options);
    res.json({ tweet });
  } catch (error) {
    console.error('Tweet generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate multiple tweet variations
app.post('/api/tweets/generate-variations', async (req, res) => {
  try {
    const { prompt, count = 3, options = {} } = req.body;
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const tweets = await generateTweetVariations(prompt, count, options);
    res.json({ tweets });
  } catch (error) {
    console.error('Tweet variations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== Newsboard Endpoints ====================
// All endpoints read from Supabase - no direct News API calls

const {
  getRecentNews,
  getHourlyMetrics,
  getRecentAnomalies,
  getAllSources
} = require('./services/supabase');

// Get recent news articles
app.get('/api/newsboard/recent', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const source = req.query.source || null;
    const isAnomaly = req.query.isAnomaly === 'true' ? true : req.query.isAnomaly === 'false' ? false : null;

    const articles = await getRecentNews({
      hours,
      limit,
      offset,
      source,
      isAnomaly
    });

    res.json({ articles, count: articles.length });
  } catch (error) {
    console.error('Error fetching recent news:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch recent news',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get hourly metrics for BI dashboard
app.get('/api/newsboard/metrics', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const metrics = await getHourlyMetrics({ hours });

    res.json({ metrics, count: metrics.length });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch metrics',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get recent anomalies
app.get('/api/newsboard/anomalies', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;

    const anomalies = await getRecentAnomalies({ limit, status });

    res.json({ anomalies, count: anomalies.length });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch anomalies',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all sources
app.get('/api/newsboard/sources', async (req, res) => {
  try {
    const sources = await getAllSources();
    res.json({ sources, count: sources.length });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch sources',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get aggregated stats for dashboard
app.get('/api/newsboard/stats', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    
    const [articles, metrics, anomalies, sources] = await Promise.all([
      getRecentNews({ hours, limit: 1000 }).catch((err) => {
        console.error('Error in getRecentNews:', err);
        return [];
      }),
      getHourlyMetrics({ hours }).catch((err) => {
        console.error('Error in getHourlyMetrics:', err);
        return [];
      }),
      getRecentAnomalies({ limit: 100 }).catch((err) => {
        console.error('Error in getRecentAnomalies:', err);
        return [];
      }),
      getAllSources().catch((err) => {
        console.error('Error in getAllSources:', err);
        return [];
      })
    ]);

    const totalArticles = articles.length;
    const totalAnomalies = anomalies.length;
    const totalSources = sources.length;
    
    const sentiments = articles.map(a => a.sentiment_score).filter(s => s !== null && s !== undefined);
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : null;

    const anomalyRate = totalArticles > 0 ? (totalAnomalies / totalArticles) * 100 : 0;

    // Calculate volume trend from metrics
    const volumeTrend = metrics.map(m => m.volume || 0);

    // Calculate sentiment distribution from articles
    const positiveCount = articles.filter(a => 
      (a.sentiment_label === 'positive' || (a.sentiment_score && a.sentiment_score > 0.1))
    ).length;
    const neutralCount = articles.filter(a => 
      (a.sentiment_label === 'neutral' || (a.sentiment_score && a.sentiment_score >= -0.1 && a.sentiment_score <= 0.1))
    ).length;
    const negativeCount = articles.filter(a => 
      (a.sentiment_label === 'negative' || (a.sentiment_score && a.sentiment_score < -0.1))
    ).length;

    // Get latest metrics or create from articles
    let latestMetrics = metrics[metrics.length - 1];
    if (!latestMetrics || !latestMetrics.positive_count) {
      latestMetrics = {
        ...latestMetrics,
        positive_count: positiveCount,
        neutral_count: neutralCount,
        negative_count: negativeCount
      };
    }

    res.json({
      total_articles: totalArticles,
      total_anomalies: totalAnomalies,
      total_sources: totalSources,
      avg_sentiment: avgSentiment,
      anomaly_rate: anomalyRate,
      volume_trend: volumeTrend,
      latest_metrics: latestMetrics
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch stats',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Manual trigger for news ingestion (useful for testing)
app.post('/api/newsboard/ingest', async (req, res) => {
  try {
    const { ingestNews } = require('./workers/newsIngester');
    await ingestNews();
    res.json({ success: true, message: 'News ingestion completed' });
  } catch (error) {
    console.error('Error triggering ingestion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Populate database with mock data (for testing/demo)
app.post('/api/newsboard/mock-data', async (req, res) => {
  try {
    const { populateMockData } = require('./utils/mockDataGenerator');
    const result = await populateMockData();
    res.json({ 
      success: true, 
      message: 'Mock data populated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error populating mock data:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get mock data (for preview without database)
app.get('/api/newsboard/mock-preview', async (req, res) => {
  try {
    const { generateMockArticles, generateMockAnomalies, generateMockHourlyMetrics } = require('./utils/mockDataGenerator');
    
    const rawArticles = generateMockArticles();
    const anomalies = generateMockAnomalies();
    const metrics = generateMockHourlyMetrics();
    
    // Normalize articles to match real data format (published_at instead of publishedAt)
    const articles = rawArticles.map(article => ({
      ...article,
      published_at: article.publishedAt || article.published_at,
      // Ensure all fields match real data structure
      id: article.id,
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      source: article.source,
      author: article.author,
      image_url: article.urlToImage || article.image_url,
      sentiment_score: article.sentiment_score,
      sentiment_label: article.sentiment_label,
      topic_tags: article.topic_tags || [],
      is_anomaly: article.is_anomaly || false,
      anomaly_reasons: article.anomaly_reasons || []
    }));
    
    // Calculate stats
    const sentiments = articles.map(a => a.sentiment_score).filter(s => s !== null && s !== undefined);
    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : null;
    
    const totalAnomalies = anomalies.length;
    const anomalyRate = articles.length > 0 ? (totalAnomalies / articles.length) * 100 : 0;
    const uniqueSources = new Set(articles.map(a => a.source)).size;
    
    // Calculate sentiment distribution
    const positiveCount = articles.filter(a => 
      a.sentiment_label === 'positive' || (a.sentiment_score && a.sentiment_score > 0.1)
    ).length;
    const neutralCount = articles.filter(a => 
      a.sentiment_label === 'neutral' || (a.sentiment_score !== null && a.sentiment_score !== undefined && a.sentiment_score >= -0.1 && a.sentiment_score <= 0.1)
    ).length;
    const negativeCount = articles.filter(a => 
      a.sentiment_label === 'negative' || (a.sentiment_score && a.sentiment_score < -0.1)
    ).length;
    
    const stats = {
      total_articles: articles.length,
      total_anomalies: totalAnomalies,
      total_sources: uniqueSources,
      avg_sentiment: avgSentiment,
      anomaly_rate: anomalyRate,
      volume_trend: metrics.map(m => m.volume || 0),
      latest_metrics: {
        ...metrics[metrics.length - 1],
        positive_count: positiveCount,
        neutral_count: neutralCount,
        negative_count: negativeCount
      }
    };
    
    res.json({
      stats,
      articles,
      anomalies,
      metrics
    });
  } catch (error) {
    console.error('Error generating mock preview:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Clear real data anomalies (clean up any anomalies from real news)
app.delete('/api/newsboard/clear-real-anomalies', async (req, res) => {
  try {
    const sql = require('./db');
    
    if (!sql) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    // Delete all anomalies (they will be re-detected on next ingestion if needed)
    const result = await sql`
      DELETE FROM anomalies
    `;
    
    res.json({
      success: true,
      message: 'All anomalies cleared from database',
      deleted: Array.isArray(result) ? result.length : (result.count || 0)
    });
  } catch (error) {
    console.error('Error clearing anomalies:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Clear mock data from database
app.delete('/api/newsboard/clear-mock-data', async (req, res) => {
  try {
    const sql = require('./db');
    
    if (!sql) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    // Delete mock articles (those with IDs starting with 'normal_article_', 'volume_spike_', 'sentiment_shift_', 'duplicate_')
    const result1 = await sql`
      DELETE FROM news_articles 
      WHERE id LIKE 'normal_article_%'
         OR id LIKE 'volume_spike_%'
         OR id LIKE 'sentiment_shift_%'
         OR id LIKE 'duplicate_%'
    `;
    const deletedArticles = Array.isArray(result1) ? result1.length : (result1.count || 0);

    // Delete mock anomalies (those created by mock data generator)
    const result2 = await sql`
      DELETE FROM anomalies
      WHERE related_article_id LIKE 'normal_article_%'
         OR related_article_id LIKE 'volume_spike_%'
         OR related_article_id LIKE 'sentiment_shift_%'
         OR related_article_id LIKE 'duplicate_%'
    `;
    const deletedAnomalies = Array.isArray(result2) ? result2.length : (result2.count || 0);

    // Note: We'll leave hourly_metrics as they might contain real data mixed in
    // If you want to clear them too, you can do it manually via SQL

    // Optionally reset source counts (or we can leave them as they might have real data too)
    
    res.json({
      success: true,
      message: 'Mock data cleared from database',
      deleted: {
        articles: deletedArticles,
        anomalies: deletedAnomalies.count || 0,
        metrics: deletedMetrics.count || 0
      }
    });
  } catch (error) {
    console.error('Error clearing mock data:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint for database connection
app.get('/api/newsboard/health', async (req, res) => {
  try {
    const sql = require('./db');
    
    if (!sql) {
      return res.status(500).json({ 
        healthy: false,
        error: 'Database connection not initialized',
        check: 'DATABASE_URL environment variable is missing'
      });
    }

    // Test the connection by running a simple query
    const result = await sql`SELECT 1 as test`;
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('news_articles', 'hourly_metrics', 'anomalies', 'sources')
    `;
    
    const existingTables = tables.map(t => t.table_name);
    const requiredTables = ['news_articles', 'hourly_metrics', 'anomalies', 'sources'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    res.json({
      healthy: true,
      database: 'connected',
      tables: {
        existing: existingTables,
        missing: missingTables.length > 0 ? missingTables : null
      },
      message: missingTables.length > 0 
        ? `Warning: Missing tables: ${missingTables.join(', ')}. Run supabase_schema.sql to create them.`
        : 'All tables exist'
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      healthy: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`Listening on port ${process.env.PORT || 8080}!`);
  
  // Start background news ingestion (runs every 15 minutes)
  if (process.env.NEWS_API_KEY && process.env.DATABASE_URL) {
    startNewsIngestion('*/15 * * * *'); // Every 15 minutes
    console.log('News ingestion scheduler started');
  } else {
    console.warn('News ingestion not started - missing NEWS_API_KEY or DATABASE_URL in .env');
  }
});