/**
 * Anomaly Detection Service
 * Detects anomalies in news data using statistical methods
 */

/**
 * Calculate simple sentiment score from text
 * Returns -1 (negative) to 1 (positive)
 */
function calculateSentiment(text) {
  if (!text) return 0;

  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'positive', 'success', 'win', 'gain', 'rise', 'up', 'best', 'love', 'happy', 'joy'];
  const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'fail', 'loss', 'fall', 'down', 'worst', 'hate', 'sad', 'anger', 'crisis', 'disaster'];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  return (positiveCount - negativeCount) / total;
}

/**
 * Detect volume spike anomaly
 * Compares current volume to historical average
 */
function detectVolumeSpike(currentVolume, historicalVolumes, threshold = 2) {
  if (!historicalVolumes || historicalVolumes.length === 0) {
    return null;
  }

  const mean = historicalVolumes.reduce((a, b) => a + b, 0) / historicalVolumes.length;
  const variance = historicalVolumes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalVolumes.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return null;

  const zScore = (currentVolume - mean) / stdDev;

  if (Math.abs(zScore) >= threshold) {
    return {
      type: 'volume_spike',
      severity: Math.min(Math.abs(zScore) / threshold, 5), // Cap at 5
      zScore: zScore,
      current: currentVolume,
      average: mean,
      threshold: mean + (threshold * stdDev)
    };
  }

  return null;
}

/**
 * Detect sentiment shift anomaly
 * Compares current sentiment distribution to historical average
 */
function detectSentimentShift(currentSentiment, historicalSentiments, threshold = 1.5) {
  if (!historicalSentiments || historicalSentiments.length === 0) {
    return null;
  }

  const mean = historicalSentiments.reduce((a, b) => a + b, 0) / historicalSentiments.length;
  const stdDev = Math.sqrt(
    historicalSentiments.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalSentiments.length
  );

  if (stdDev === 0) return null;

  const zScore = Math.abs(currentSentiment - mean) / stdDev;

  if (zScore >= threshold) {
    return {
      type: 'sentiment_shift',
      severity: Math.min(zScore / threshold, 5),
      zScore: zScore,
      current: currentSentiment,
      average: mean,
      direction: currentSentiment > mean ? 'positive' : 'negative'
    };
  }

  return null;
}

/**
 * Detect source distribution anomaly
 * Flags when one source dominates unusually
 */
function detectSourceDominance(articles, threshold = 0.5) {
  if (!articles || articles.length === 0) return null;

  const sourceCounts = {};
  articles.forEach(article => {
    const source = article.source || 'Unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const total = articles.length;
  const maxSourceCount = Math.max(...Object.values(sourceCounts));
  const maxSourceRatio = maxSourceCount / total;

  if (maxSourceRatio >= threshold) {
    const maxSource = Object.keys(sourceCounts).find(key => sourceCounts[key] === maxSourceCount);
    return {
      type: 'source_dominance',
      severity: Math.min(maxSourceRatio * 2, 5),
      dominant_source: maxSource,
      ratio: maxSourceRatio,
      count: maxSourceCount,
      total: total
    };
  }

  return null;
}

/**
 * Detect duplicate/near-duplicate content
 */
function detectDuplicateContent(articles, similarityThreshold = 0.8) {
  if (!articles || articles.length < 2) return null;

  const duplicates = [];
  const checked = new Set();

  for (let i = 0; i < articles.length; i++) {
    if (checked.has(i)) continue;
    
    const group = [i];
    const title1 = (articles[i].title || '').toLowerCase();
    
    for (let j = i + 1; j < articles.length; j++) {
      if (checked.has(j)) continue;
      
      const title2 = (articles[j].title || '').toLowerCase();
      const similarity = calculateSimilarity(title1, title2);
      
      if (similarity >= similarityThreshold) {
        group.push(j);
        checked.add(j);
      }
    }

    if (group.length >= 2) {
      duplicates.push({
        count: group.length,
        articles: group.map(idx => ({
          id: articles[idx].id,
          title: articles[idx].title,
          source: articles[idx].source
        }))
      });
      checked.add(i);
    }
  }

  if (duplicates.length > 0) {
    return {
      type: 'duplicate_content',
      severity: Math.min(duplicates.length * 0.5, 5),
      duplicate_groups: duplicates.length,
      total_duplicates: duplicates.reduce((sum, d) => sum + d.count, 0)
    };
  }

  return null;
}

/**
 * Calculate string similarity (simple Jaccard similarity)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Detect temporal anomaly (unusual posting time)
 * This would require historical time patterns - simplified version
 */
function detectTemporalAnomaly(hour, historicalHourDistribution) {
  // Simplified: flag if hour is outside normal business hours and has high volume
  // This is a placeholder - would need historical data for proper detection
  return null;
}

/**
 * Main anomaly detection function
 * Analyzes a batch of articles and historical data
 */
async function detectAnomalies(articles, historicalMetrics = {}) {
  const anomalies = [];

  if (!articles || articles.length === 0) {
    return anomalies;
  }

  // Calculate current metrics
  const currentVolume = articles.length;
  const sentiments = articles.map(a => calculateSentiment(a.title + ' ' + (a.description || '')));
  const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

  // Store sentiment scores on articles
  articles.forEach((article, idx) => {
    article.sentiment_score = sentiments[idx];
  });

  // 1. Volume spike detection
  if (historicalMetrics.volumes && historicalMetrics.volumes.length > 0) {
    const volumeAnomaly = detectVolumeSpike(currentVolume, historicalMetrics.volumes);
    if (volumeAnomaly) {
      anomalies.push({
        ...volumeAnomaly,
        detected_at: new Date().toISOString(),
        explanation: `Volume spike detected: ${currentVolume} articles (average: ${volumeAnomaly.average.toFixed(1)})`
      });
    }
  }

  // 2. Sentiment shift detection
  if (historicalMetrics.sentiments && historicalMetrics.sentiments.length > 0) {
    const sentimentAnomaly = detectSentimentShift(avgSentiment, historicalMetrics.sentiments);
    if (sentimentAnomaly) {
      anomalies.push({
        ...sentimentAnomaly,
        detected_at: new Date().toISOString(),
        explanation: `Sentiment shift detected: ${sentimentAnomaly.direction} shift (${avgSentiment.toFixed(2)} vs ${sentimentAnomaly.average.toFixed(2)} average)`
      });
    }
  }

  // 3. Source dominance detection
  const sourceAnomaly = detectSourceDominance(articles);
  if (sourceAnomaly) {
    anomalies.push({
      ...sourceAnomaly,
      detected_at: new Date().toISOString(),
      explanation: `Source dominance: ${sourceAnomaly.dominant_source} accounts for ${(sourceAnomaly.ratio * 100).toFixed(1)}% of articles`
    });
  }

  // 4. Duplicate content detection
  const duplicateAnomaly = detectDuplicateContent(articles);
  if (duplicateAnomaly) {
    anomalies.push({
      ...duplicateAnomaly,
      detected_at: new Date().toISOString(),
      explanation: `Duplicate content detected: ${duplicateAnomaly.duplicate_groups} groups of similar articles`
    });
  }

  // Mark articles as anomalies if they're part of detected anomalies
  articles.forEach(article => {
    const articleAnomalies = anomalies.filter(a => {
      // Check if article is part of this anomaly
      if (a.type === 'duplicate_content' && a.duplicate_groups > 0) {
        // Could mark specific articles, but for simplicity just check source dominance
        return a.dominant_source === article.source;
      }
      return false;
    });

    if (articleAnomalies.length > 0) {
      article.is_anomaly = true;
      article.anomaly_reasons = articleAnomalies.map(a => a.type);
    }
  });

  return anomalies;
}

module.exports = {
  calculateSentiment,
  detectVolumeSpike,
  detectSentimentShift,
  detectSourceDominance,
  detectDuplicateContent,
  detectAnomalies
};

