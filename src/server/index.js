const express = require('express');
const os = require('os');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

app.use(express.static('dist'));
app.get('/api/getUsername', (req, res) => res.send({ username: os.userInfo().username }));

// GET /api/search?q=...
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' });
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
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Simple in-memory cache to mitigate rate limits (not for production scale)
const cache = new Map(); // key -> { ts, data }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchJson(url, token) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await r.json();
  if (!r.ok) {
    const message = json && (json.title || json.error || json.message || JSON.stringify(json));
    const err = new Error(message || 'Request failed');
    err.status = r.status;
    throw err;
  }
  return json;
}

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
    return res.json(cached.data);
  }

  try {
    // 1) User profile
    const user = await fetchJson(`https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=public_metrics,created_at,verified,description,location,profile_image_url`, token);

    const userId = user && user.data && user.data.id;
    if (!userId) return res.status(404).json({ error: 'User not found' });

    // 2) Recent tweets for frequency estimate
    const tweets = await fetchJson(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics`, token);

    const tweetList = Array.isArray(tweets.data) ? tweets.data : [];
    let tweetsPerDay = 0;
    if (tweetList.length >= 2) {
      const times = tweetList.map(t => new Date(t.created_at).getTime());
      const max = Math.max(...times);
      const min = Math.min(...times);
      const days = Math.max(1, (max - min) / (1000 * 60 * 60 * 24));
      tweetsPerDay = Number((tweetList.length / days).toFixed(2));
    } else if (tweetList.length === 1) {
      tweetsPerDay = 1; // minimal estimate
    }

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
        likes: tweetList.reduce((a, t) => a + ((t.public_metrics && t.public_metrics.like_count) || 0), 0),
        retweets: tweetList.reduce((a, t) => a + ((t.public_metrics && t.public_metrics.retweet_count) || 0), 0)
      },
      recentTweets: tweetList
    };

    cache.set(cacheKey, { ts: now, data: payload });
    return res.json(payload);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'Failed to fetch analytics' });
  }
});

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
