const express = require('express');
const os = require('os');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

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

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));