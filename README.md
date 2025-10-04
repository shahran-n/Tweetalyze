# 🐦 Tweetalyze

A powerful Twitter/X analytics dashboard that provides insights into user activity, engagement metrics, and tweet analysis. Built with React, Node and Express.


## Features

### User Analytics 📊 
- **Profile Metrics**: Followers, following, tweet count, and verification status
- **Engagement Stats**: Likes, retweets, and average tweet length
- **Activity Frequency**: Tweets per day calculation
- **Word Cloud Analysis**: Top 20 most used words in recent tweets
- **Media Breakdown**: Visual distribution of photos, videos, GIFs, links, and text-only tweets

### Smart Search 🔍 
- Search by Twitter handle for detailed user analytics
- General tweet search functionality
- Intelligent caching system (1-hour cache) to minimize API calls
- Rate limit tracking and management


## 🛠️ Tech Stack

**Frontend:**
- React 17
- Vanilla CSS with responsive design
- Hash-based routing

**Backend:**
- Node.js
- Express
- Twitter/X API v2
- In-memory caching

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Twitter/X API Bearer Token ([Get one here](https://developer.x.com/en/portal/dashboard))

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
# Twitter/X API Configuration
X_BEARER_TOKEN=your_twitter_bearer_token_here

```

4. **Build the frontend**
```bash
npm run build
```

5. **Start the server**
```bash
npm start
```

6. **Open your browser**
```
http://localhost:8080
```

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
---
