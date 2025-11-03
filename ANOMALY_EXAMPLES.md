# Anomaly Detection Examples

This document shows what different types of anomalies look like in the newsboard system.

## How to Generate Mock Data

Run this endpoint to populate your database with sample data including anomalies:

```bash
curl -X POST http://localhost:8080/api/newsboard/mock-data
```

Or visit the endpoint in your browser/Postman.

## Anomaly Types

### 1. Volume Spike Anomaly

**What it looks like:**
- **Detection**: Sudden increase in article volume compared to historical average
- **Example**: Normally 20-30 articles per hour, suddenly 45+ articles
- **Severity**: Based on z-score (standard deviations from mean)

**Mock Data Example:**
```
Anomaly Type: volume_spike
Severity: 3.5
Explanation: "Volume spike detected: 11 articles from CNN in the last hour (average: 7-8 articles per hour)"
Metadata: {
  current_volume: 11,
  average_volume: 7.5,
  z_score: 2.8,
  dominant_source: 'CNN'
}
```

**What triggers it:**
- Breaking news events
- Coordinated news releases
- System issues causing duplicate ingestion

---

### 2. Sentiment Shift Anomaly

**What it looks like:**
- **Detection**: Sudden change in average sentiment score
- **Example**: Normally neutral (0.0 to 0.2), suddenly very negative (-0.8)
- **Severity**: Based on how far from historical average

**Mock Data Example:**
```
Anomaly Type: sentiment_shift
Severity: 4.2
Explanation: "Sentiment shift detected: Negative sentiment spike (-0.85 vs 0.05 average). Multiple crisis-related articles."
Metadata: {
  current_sentiment: -0.85,
  average_sentiment: 0.05,
  z_score: 3.2,
  direction: 'negative'
}
```

**What triggers it:**
- Crisis events (market crashes, disasters)
- Controversial news breaking
- Coordinated negative coverage

---

### 3. Source Dominance Anomaly

**What it looks like:**
- **Detection**: One source accounts for unusually high percentage of articles
- **Example**: CNN accounts for 52% of articles when threshold is 50%
- **Severity**: Based on dominance ratio

**Mock Data Example:**
```
Anomaly Type: source_dominance
Severity: 2.8
Explanation: "Source dominance: CNN accounts for 52% of articles in the last hour (threshold: 50%)"
Metadata: {
  dominant_source: 'CNN',
  ratio: 0.52,
  count: 11,
  total: 21
}
```

**What triggers it:**
- Breaking news exclusive to one source
- Source-specific event coverage
- Potential manipulation or coordination

---

### 4. Duplicate Content Anomaly

**What it looks like:**
- **Detection**: Multiple articles with very similar titles/content
- **Example**: 3 articles with 85%+ similarity in title
- **Severity**: Based on number of duplicate groups

**Mock Data Example:**
```
Anomaly Type: duplicate_content
Severity: 2.1
Explanation: "Duplicate content detected: 3 groups of similar articles about the same topic"
Metadata: {
  duplicate_groups: 1,
  total_duplicates: 3,
  similarity_score: 0.85
}
```

**What triggers it:**
- News wire services (AP, Reuters) distributing same story
- Multiple outlets covering same breaking news
- Potential content scraping/manipulation

---

## Visual Examples in the Dashboard

### Articles Marked as Anomalies

In the Newsboard dashboard, articles with anomalies will:
- Have a red **ANOMALY** badge
- Show up in the "Recent Anomalies" panel
- Include `anomaly_reasons` field showing types detected

### Anomaly Details Panel

The anomalies panel shows:
- **Type**: Which anomaly was detected (volume_spike, sentiment_shift, etc.)
- **Severity Score**: 0-5 scale (higher = more severe)
- **Explanation**: Human-readable description
- **Timestamp**: When it was detected

### Example Article with Anomaly

```json
{
  "id": "volume_spike_1",
  "title": "Breaking: Major Economic Policy Announcement",
  "source": "CNN",
  "is_anomaly": true,
  "anomaly_reasons": ["volume_spike", "source_dominance"],
  "sentiment_score": -0.3
}
```

---

## Real-World Scenarios

### Scenario 1: Breaking News Event
- **Volume Spike**: Multiple outlets rush to cover the story
- **Source Dominance**: One outlet breaks the story first
- **Sentiment Shift**: Could be positive (celebrity news) or negative (disaster)

### Scenario 2: Market Crash
- **Sentiment Shift**: Sudden negative sentiment (-0.8 to -0.9)
- **Volume Spike**: Financial news outlets increase coverage
- **Duplicate Content**: Similar analysis from multiple sources

### Scenario 3: Coordinated Campaign
- **Source Dominance**: Unusual concentration from one source
- **Duplicate Content**: Similar messaging across articles
- **Volume Spike**: Unusually high posting frequency

---

## Understanding Severity Scores

- **0-1**: Minor anomaly, likely normal variation
- **1-2**: Moderate anomaly, worth monitoring
- **2-3**: Significant anomaly, investigate
- **3-4**: High severity, potential issue
- **4-5**: Critical anomaly, requires immediate attention

---

## Next Steps

1. **Generate Mock Data**: Use `/api/newsboard/mock-data` endpoint
2. **View Dashboard**: Navigate to `#/newsboard` in your app
3. **Check Anomalies Panel**: See all detected anomalies
4. **Review Articles**: Look for red ANOMALY badges on articles
5. **Examine Details**: Click on anomalies to see full explanations

