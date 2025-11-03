-- Supabase Database Schema for Newsboard Feature
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  sentiment_score NUMERIC,
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
  topic_tags TEXT[],
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_reasons TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for news_articles
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles(source);
CREATE INDEX IF NOT EXISTS idx_news_articles_is_anomaly ON news_articles(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at DESC);

-- Hourly Metrics Table
CREATE TABLE IF NOT EXISTS hourly_metrics (
  hour TEXT PRIMARY KEY, -- Format: YYYY-MM-DD-HH
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  volume INTEGER DEFAULT 0,
  avg_sentiment NUMERIC,
  top_topics TEXT[],
  anomalies_detected INTEGER DEFAULT 0,
  sources_count INTEGER DEFAULT 0,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for hourly_metrics
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_hour ON hourly_metrics(hour DESC);

-- Anomalies Table
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type TEXT NOT NULL,
  severity_score NUMERIC DEFAULT 0,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  related_article_id TEXT,
  related_hour TEXT,
  explanation TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'false_positive'))
);

-- Indexes for anomalies
CREATE INDEX IF NOT EXISTS idx_anomalies_detected_at ON anomalies(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON anomalies(status);
CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(anomaly_type);

-- Sources Table
CREATE TABLE IF NOT EXISTS sources (
  name TEXT PRIMARY KEY,
  credibility_score NUMERIC,
  article_count INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for sources
CREATE INDEX IF NOT EXISTS idx_sources_article_count ON sources(article_count DESC);

-- Enable Row Level Security (optional - adjust based on your needs)
-- ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (adjust as needed)
-- For now, we'll use service role key which bypasses RLS
-- If you want public read access, create policies like:

-- CREATE POLICY "Allow public read access to news_articles" ON news_articles
--   FOR SELECT USING (true);

-- CREATE POLICY "Allow public read access to hourly_metrics" ON hourly_metrics
--   FOR SELECT USING (true);

-- CREATE POLICY "Allow public read access to anomalies" ON anomalies
--   FOR SELECT USING (true);

-- CREATE POLICY "Allow public read access to sources" ON sources
--   FOR SELECT USING (true);

