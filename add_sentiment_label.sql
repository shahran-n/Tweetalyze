-- Add sentiment_label column to news_articles table
-- Run this in your Supabase SQL Editor if the column doesn't exist yet

ALTER TABLE news_articles 
ADD COLUMN IF NOT EXISTS sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral'));

-- Create index for faster sentiment queries
CREATE INDEX IF NOT EXISTS idx_news_articles_sentiment_label ON news_articles(sentiment_label);

