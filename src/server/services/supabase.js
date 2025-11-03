const sql = require('../db');
require('dotenv').config();

if (!sql) {
  console.warn('WARNING: Database connection not initialized. Set DATABASE_URL in .env');
}

// ==================== News Articles ====================

/**
 * Store a news article
 * @param {Object} article - News article data
 */
async function storeNewsArticle(article) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const articleId = article.id || article.url;
    const articleTitle = article.title;
    const articleDescription = article.description;
    const articleContent = article.content;
    const articleUrl = article.url;
    const articleSource = article.source?.name || article.source;
    const articleAuthor = article.author;
    const articlePublishedAt = article.publishedAt || article.published_at;
    const articleImageUrl = article.urlToImage;
    const articleSentimentScore = article.sentiment_score || null;
    const articleSentimentLabel = article.sentiment_label || null;
    const articleTopicTags = article.topic_tags || [];
    const articleIsAnomaly = article.is_anomaly || false;
    const articleAnomalyReasons = article.anomaly_reasons || [];
    const articleMetadata = article.metadata || {};
    const articleCreatedAt = new Date().toISOString();

    const [result] = await sql`
      INSERT INTO news_articles (
        id, title, description, content, url, source, author, published_at, 
        image_url, sentiment_score, sentiment_label, topic_tags, is_anomaly, anomaly_reasons, 
        metadata, created_at
      ) VALUES (
        ${articleId}, ${articleTitle}, ${articleDescription}, ${articleContent}, 
        ${articleUrl}, ${articleSource}, ${articleAuthor}, ${articlePublishedAt}, 
        ${articleImageUrl}, ${articleSentimentScore}, ${articleSentimentLabel}, ${articleTopicTags}, 
        ${articleIsAnomaly}, ${articleAnomalyReasons}, ${articleMetadata}, 
        ${articleCreatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        content = EXCLUDED.content,
        source = EXCLUDED.source,
        author = EXCLUDED.author,
        published_at = EXCLUDED.published_at,
        image_url = EXCLUDED.image_url,
        sentiment_score = EXCLUDED.sentiment_score,
        sentiment_label = EXCLUDED.sentiment_label,
        topic_tags = EXCLUDED.topic_tags,
        is_anomaly = EXCLUDED.is_anomaly,
        anomaly_reasons = EXCLUDED.anomaly_reasons,
        metadata = EXCLUDED.metadata
      RETURNING *
    `;

    return result;
  } catch (error) {
    console.error('Error storing news article:', error);
    throw error;
  }
}

/**
 * Store multiple news articles in batch
 * @param {Array} articles - Array of news articles
 */
async function storeNewsArticlesBatch(articles) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    if (articles.length === 0) return [];

    // Insert articles one by one or use a transaction
    // For batch inserts with postgres library, we'll use a simpler approach
    const results = [];
    for (const article of articles) {
      try {
        const result = await storeNewsArticle(article);
        if (result) results.push(result);
      } catch (error) {
        console.error('Error storing article in batch:', error);
        // Continue with other articles
      }
    }
    return results;
  } catch (error) {
    console.error('Error storing news articles batch:', error);
    throw error;
  }
}

/**
 * Get recent news articles
 * @param {Object} options - Query options
 */
async function getRecentNews(options = {}) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const {
      limit = 50,
      offset = 0,
      hours = 24,
      source = null,
      isAnomaly = null
    } = options;

    // Build query conditionally
    let query;
    
    // Filter by time
    if (hours) {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      if (source && isAnomaly !== null) {
        query = sql`
          SELECT * FROM news_articles
          WHERE published_at >= ${cutoffTime}
            AND source = ${source}
            AND is_anomaly = ${isAnomaly}
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (source) {
        query = sql`
          SELECT * FROM news_articles
          WHERE published_at >= ${cutoffTime}
            AND source = ${source}
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (isAnomaly !== null) {
        query = sql`
          SELECT * FROM news_articles
          WHERE published_at >= ${cutoffTime}
            AND is_anomaly = ${isAnomaly}
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        query = sql`
          SELECT * FROM news_articles
          WHERE published_at >= ${cutoffTime}
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }
    } else {
      // No time filter
      if (source && isAnomaly !== null) {
        query = sql`
          SELECT * FROM news_articles
          WHERE source = ${source}
            AND is_anomaly = ${isAnomaly}
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (source) {
        query = sql`
          SELECT * FROM news_articles
          WHERE source = ${source}
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else if (isAnomaly !== null) {
        query = sql`
          SELECT * FROM news_articles
          WHERE is_anomaly = ${isAnomaly}
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        query = sql`
          SELECT * FROM news_articles
          ORDER BY published_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      }
    }

    const result = await query;
    return result || [];
  } catch (error) {
    console.error('Error getting recent news:', error);
    throw error;
  }
}

// ==================== Hourly Metrics ====================

/**
 * Store hourly aggregated metrics
 * @param {Object} metrics - Hourly metrics data
 */
async function storeHourlyMetrics(metrics) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const hourKey = metrics.hour || getCurrentHourKey();
    
    const metricsHour = hourKey;
    const metricsTimestamp = metrics.timestamp || new Date().toISOString();
    const metricsVolume = metrics.volume || 0;
    const metricsAvgSentiment = metrics.avg_sentiment || null;
    const metricsTopTopics = metrics.top_topics || [];
    const metricsAnomaliesDetected = metrics.anomalies_detected || 0;
    const metricsSourcesCount = metrics.sources_count || 0;
    const metricsPositiveCount = metrics.positive_count || 0;
    const metricsNeutralCount = metrics.neutral_count || 0;
    const metricsNegativeCount = metrics.negative_count || 0;
    const metricsUpdatedAt = new Date().toISOString();

    const [result] = await sql`
      INSERT INTO hourly_metrics (
        hour, timestamp, volume, avg_sentiment, top_topics, anomalies_detected,
        sources_count, positive_count, neutral_count, negative_count, updated_at
      ) VALUES (
        ${metricsHour}, ${metricsTimestamp}, ${metricsVolume}, ${metricsAvgSentiment},
        ${metricsTopTopics}, ${metricsAnomaliesDetected}, ${metricsSourcesCount},
        ${metricsPositiveCount}, ${metricsNeutralCount}, ${metricsNegativeCount},
        ${metricsUpdatedAt}
      )
      ON CONFLICT (hour) DO UPDATE SET
        timestamp = EXCLUDED.timestamp,
        volume = EXCLUDED.volume,
        avg_sentiment = EXCLUDED.avg_sentiment,
        top_topics = EXCLUDED.top_topics,
        anomalies_detected = EXCLUDED.anomalies_detected,
        sources_count = EXCLUDED.sources_count,
        positive_count = EXCLUDED.positive_count,
        neutral_count = EXCLUDED.neutral_count,
        negative_count = EXCLUDED.negative_count,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `;

    return result;
  } catch (error) {
    console.error('Error storing hourly metrics:', error);
    throw error;
  }
}

/**
 * Get hourly metrics for a time range
 * @param {Object} options - Query options
 */
async function getHourlyMetrics(options = {}) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const { hours = 24 } = options;
    const cutoffHour = getHourKeyForHoursAgo(hours);

    const result = await sql`
      SELECT * FROM hourly_metrics
      WHERE hour >= ${cutoffHour}
      ORDER BY hour ASC
    `;

    return result || [];
  } catch (error) {
    console.error('Error getting hourly metrics:', error);
    throw error;
  }
}

// ==================== Anomalies ====================

/**
 * Store a detected anomaly
 * @param {Object} anomaly - Anomaly data
 */
async function storeAnomaly(anomaly) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const anomalyType = anomaly.anomaly_type;
    const anomalySeverityScore = anomaly.severity_score || 0;
    const anomalyDetectedAt = anomaly.detected_at || new Date().toISOString();
    const anomalyRelatedArticleId = anomaly.related_article_id || null;
    const anomalyRelatedHour = anomaly.related_hour || getCurrentHourKey();
    const anomalyExplanation = anomaly.explanation || '';
    const anomalyMetadata = anomaly.metadata || {};
    const anomalyStatus = anomaly.status || 'new';

    const [result] = await sql`
      INSERT INTO anomalies (
        anomaly_type, severity_score, detected_at, related_article_id,
        related_hour, explanation, metadata, status
      ) VALUES (
        ${anomalyType}, ${anomalySeverityScore}, ${anomalyDetectedAt},
        ${anomalyRelatedArticleId}, ${anomalyRelatedHour}, ${anomalyExplanation},
        ${anomalyMetadata}, ${anomalyStatus}
      )
      RETURNING *
    `;

    return result;
  } catch (error) {
    console.error('Error storing anomaly:', error);
    throw error;
  }
}

/**
 * Get recent anomalies
 * @param {Object} options - Query options
 */
async function getRecentAnomalies(options = {}) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const { limit = 20, status = null } = options;

    if (status) {
      const result = await sql`
        SELECT * FROM anomalies
        WHERE status = ${status}
        ORDER BY detected_at DESC
        LIMIT ${limit}
      `;
      return result || [];
    } else {
      const result = await sql`
        SELECT * FROM anomalies
        ORDER BY detected_at DESC
        LIMIT ${limit}
      `;
      return result || [];
    }
  } catch (error) {
    console.error('Error getting anomalies:', error);
    throw error;
  }
}

// ==================== Sources ====================

/**
 * Store or update source metadata
 * @param {Object} source - Source data
 */
async function storeSource(source) {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const sourceName = source.name;
    const sourceCredibilityScore = source.credibility_score || null;
    const sourceArticleCount = source.article_count || 0;
    const sourceLastSeen = new Date().toISOString();
    const sourceMetadata = source.metadata || {};

    const [result] = await sql`
      INSERT INTO sources (
        name, credibility_score, article_count, last_seen, metadata
      ) VALUES (
        ${sourceName}, ${sourceCredibilityScore}, ${sourceArticleCount},
        ${sourceLastSeen}, ${sourceMetadata}
      )
      ON CONFLICT (name) DO UPDATE SET
        credibility_score = EXCLUDED.credibility_score,
        article_count = EXCLUDED.article_count,
        last_seen = EXCLUDED.last_seen,
        metadata = EXCLUDED.metadata
      RETURNING *
    `;

    return result;
  } catch (error) {
    console.error('Error storing source:', error);
    throw error;
  }
}

/**
 * Get all sources
 */
async function getAllSources() {
  try {
    if (!sql) {
      throw new Error('Database not initialized');
    }

    const result = await sql`
      SELECT * FROM sources
      ORDER BY article_count DESC
    `;

    return result || [];
  } catch (error) {
    console.error('Error getting sources:', error);
    throw error;
  }
}

// ==================== Helper Functions ====================

/**
 * Get current hour key in format: YYYY-MM-DD-HH
 */
function getCurrentHourKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
}

/**
 * Get hour key for N hours ago
 */
function getHourKeyForHoursAgo(hours) {
  const date = new Date(Date.now() - hours * 60 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
}

module.exports = {
  // News articles
  storeNewsArticle,
  storeNewsArticlesBatch,
  getRecentNews,
  // Hourly metrics
  storeHourlyMetrics,
  getHourlyMetrics,
  // Anomalies
  storeAnomaly,
  getRecentAnomalies,
  // Sources
  storeSource,
  getAllSources
};
