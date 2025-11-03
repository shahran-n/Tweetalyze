# Tweetalyze

Twitter/X analytics dashboard that provides insights into user activity, engagement metrics, and tweet analysis. Built with React, Node and Express.


## Features

### User Analytics 📊 
- **Profile Metrics**: Followers, following, tweet count, and verification status
- **Engagement Stats**: Likes, retweets, and average tweet length
- **Activity Frequency**: Tweets per day calculation
- **Word Cloud Analysis**: Top 20 most used words in recent tweets
- **Media Breakdown**: Visual distribution of photos, videos, GIFs, links, and text-only tweets


### Tweet Generator 🤖
- **AI-Powered Generation**: GPT-based tweet generation from prompts
- **Customizable Options**: Control tone, style, and hashtag usage
- **Multiple Variations**: Generate multiple tweet options at once

### Newsboard 📰
- **Real-Time News Ingestion**: Automated fetching from News API with scheduled updates
- **Anomaly Detection**: Statistical detection of volume spikes, sentiment shifts, source dominance, and duplicate content
- **AI Sentiment Analysis**: GPT-powered sentiment classification (positive, negative, neutral) for each article
- **Visual Analytics**: 
  - Sentiment over time X-Y graph showing trends
  - Source distribution pie chart
  - Hourly metrics and volume tracking
- **Database Integration**: PostgreSQL (Supabase) for persistent storage and historical analysis
- **Mock Data Mode**: Toggle between real and mock data for testing and development
- **BI Dashboard**: Real-time metrics, anomaly alerts, and comparative analytics


## 🛠️ Tech Stack

**Frontend:**
- React 17
- Vanilla CSS with responsive design
- Hash-based routing

**Backend:**
- Node.js
- Express
- Twitter/X API v2
- OpenAI API (GPT)
- News API
- PostgreSQL (Supabase)
- node-cron (scheduled tasks)
- In-memory caching

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Twitter/X API Bearer Token ([Get one here](https://developer.x.com/en/portal/dashboard))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- News API key ([Get one here](https://newsapi.org/register)) - Optional, for Newsboard feature
- Supabase PostgreSQL database URL - Optional, for Newsboard feature

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tweetalyze.git
cd tweetalyze
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Twitter/X API Configuration (for read-only operations)
X_BEARER_TOKEN=your_twitter_bearer_token_here

# OpenAI Configuration (for tweet generation)
OPENAI_API_KEY=your_openai_api_key

# News API Configuration (for Newsboard feature)
NEWS_API_KEY=your_news_api_key_here

# Database Configuration (for Newsboard feature - Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database?pgbouncer=true
```

### Database Setup (Newsboard Feature)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Get your connection string** from Supabase Dashboard → Settings → Database → Connection Pooling

3. **Run the database schema** to create required tables:
   ```bash
   # Using psql or your preferred PostgreSQL client
   psql $DATABASE_URL -f supabase_schema.sql
   ```

4. **Verify tables were created**:
   - `news_articles`
   - `hourly_metrics`
   - `anomalies`
   - `news_sources`

## Troubleshooting

### Rate Limit Errors

If you see "Too Many Requests" errors:

1. **Wait for rate limit reset** (15 minutes from first request)
2. **Check your limits**: Visit `/api/rate-limit-status`
3. **Upgrade API tier**: Consider Twitter API Basic ($100/month) for higher limits

### No Data Showing

- Verify your `X_BEARER_TOKEN` is correct in `.env`
- Check the user has tweeted recently (within 7 days for free tier)
- Open browser console (F12) to check for errors
- Restart the server after changing `.env`

### Tweet Generator Issues

**OpenAI Generation Fails:**
- Verify `OPENAI_API_KEY` is correct
- Check your OpenAI account has sufficient credits
- Review API rate limits in OpenAI dashboard

### Newsboard Issues

**News Not Updating:**
- Verify `NEWS_API_KEY` is set in `.env`
- Check database connection with `/api/newsboard/health` endpoint
- Ensure `DATABASE_URL` uses Supabase session pooler format (`?pgbouncer=true`)
- Check server logs for ingestion errors

**No Data Displayed:**
- Verify database tables exist (run `supabase_schema.sql`)
- Try generating mock data: `POST /api/newsboard/mock-data`
- Toggle between "Mock Data" and "Real Data" modes in the UI
- Check browser console for API errors

**Sentiment Analysis Not Working:**
- Ensure `OPENAI_API_KEY` is configured
- Check OpenAI API rate limits and quota
- Review server logs for GPT API errors

---
