# Newsboard Feature Setup Guide

This guide will help you set up the Newsboard feature with News API and Supabase.

## Prerequisites

1. **News API Account**: Sign up at https://newsapi.org/ (free tier available)
2. **Supabase Account**: Sign up at https://supabase.com/ (free tier available)

## Step 1: Get API Keys

### News API Key
1. Go to https://newsapi.org/register
2. Sign up for a free account
3. Copy your API key from the dashboard
4. Free tier allows 100 requests per day

### Supabase Setup
1. Go to https://supabase.com/
2. Create a new project
3. Go to Project Settings → Database
4. Copy your **Connection Pooling** connection string (Session mode)
   - Look for "Connection string" under "Connection pooling"
   - Should look like: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - Or use the Transaction mode connection string if preferred

## Step 2: Set Up Supabase Database

1. Open your Supabase project
2. Go to SQL Editor
3. Copy and paste the contents of `supabase_schema.sql`
4. Run the SQL script to create all tables

## Step 3: Configure Environment Variables

Add these to your `.env` file in the project root:

```env
# News API
NEWS_API_KEY=your_news_api_key_here

# Supabase Database (Session Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Note**: Make sure to use the **Connection Pooling** connection string, not the direct connection. The pooler uses port 6543 (Session mode) or 5432 (Transaction mode).

## Step 4: Install Dependencies

```bash
npm install
```

This will install:
- `postgres` - PostgreSQL client library (for direct database connection)
- `node-cron` - For scheduled background jobs

## Step 5: Start the Application

```bash
npm run dev
```

The background news ingestion will start automatically and run every 15 minutes.

**Important**: Make sure your `DATABASE_URL` is set correctly. The application uses direct PostgreSQL connections via the session pooler, so it needs the connection pooling string from Supabase.

## How It Works

### Architecture
1. **Background Worker**: Runs every 15 minutes, fetches news from News API
2. **Anomaly Detection**: Analyzes articles for volume spikes, sentiment shifts, duplicates
3. **Supabase Storage**: All data stored in Supabase (articles, metrics, anomalies)
4. **Dashboard API**: Endpoints read from Supabase (no direct News API calls)
5. **Real-time Updates**: Dashboard auto-refreshes every 30 seconds

### API Endpoints

- `GET /api/newsboard/recent` - Get recent news articles
- `GET /api/newsboard/metrics` - Get hourly metrics for charts
- `GET /api/newsboard/anomalies` - Get detected anomalies
- `GET /api/newsboard/sources` - Get all news sources
- `GET /api/newsboard/stats` - Get aggregated statistics
- `POST /api/newsboard/ingest` - Manually trigger news ingestion (testing)

### Database Tables

1. **news_articles**: Stores individual news articles
2. **hourly_metrics**: Pre-aggregated hourly statistics
3. **anomalies**: Detected anomalies with explanations
4. **sources**: News source metadata and counts

## Testing

1. Manually trigger ingestion:
   ```bash
   curl -X POST http://localhost:8080/api/newsboard/ingest
   ```

2. Check the Newsboard page at `#/newsboard`

3. Monitor server logs for ingestion status

## Troubleshooting

### No Data Showing
- Check that NEWS_API_KEY is set correctly
- Verify Supabase tables were created (check SQL Editor)
- Check server logs for errors
- Manually trigger ingestion via POST endpoint

### Supabase Connection Issues
- Verify DATABASE_URL is correct (should be the Connection Pooling string)
- Make sure you're using the Session mode pooler (port 6543) or Transaction mode (port 5432)
- Check that tables exist in your Supabase project
- Ensure your Supabase project is active (not paused)
- Test the connection string format - it should start with `postgresql://`

### News API Rate Limits
- Free tier: 100 requests/day
- Ingestion runs every 15 minutes = ~96 requests/day
- If you hit limits, adjust the cron schedule in `src/server/index.js`

## Customization

### Change Ingestion Frequency
Edit `src/server/index.js`, line 424:
```javascript
startNewsIngestion('*/15 * * * *'); // Change to desired cron schedule
```

### Adjust Anomaly Detection Sensitivity
Edit `src/server/services/anomalyDetection.js`:
- Volume spike threshold (default: 2 standard deviations)
- Sentiment shift threshold (default: 1.5 standard deviations)

### Add More News Categories
Edit `src/server/workers/newsIngester.js`:
```javascript
const { articles } = await fetchTopHeadlines({
  category: 'technology', // business, entertainment, health, science, sports, technology
  country: 'us'
});
```

## Next Steps

- Set up Row Level Security (RLS) policies if needed
- Add more sophisticated sentiment analysis (using OpenAI)
- Implement topic clustering with ML
- Add email alerts for critical anomalies
- Create custom BI reports

