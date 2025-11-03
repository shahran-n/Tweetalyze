const fetch = require('node-fetch');
const crypto = require('crypto');
const { storeTokens, getTokens } = require('./firestore');

// Twitter OAuth 2.0 Configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'http://127.0.0.1:8080/twitter/callback';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

/**
 * Generate code verifier and challenge for PKCE
 */
function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

/**
 * Initiate OAuth 2.0 flow - returns authorization URL
 */
async function initiateOAuth(state) {
  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    throw new Error('Twitter OAuth credentials not configured. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET');
  }

  const { codeVerifier, codeChallenge } = generatePKCE();
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_REDIRECT_URI,
    scope: 'tweet.read tweet.write offline.access users.read',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  
  console.log('📋 OAuth Request Details:');
  console.log('  Redirect URI:', TWITTER_REDIRECT_URI);
  console.log('  Client ID:', TWITTER_CLIENT_ID ? '✓ Set' : '✗ Missing');
  console.log('  Full Auth URL:', authUrl);
  console.log('');
  console.log('⚠️  IMPORTANT: Make sure the Redirect URI above matches EXACTLY in Twitter app settings!');
  
  return {
    authUrl,
    codeVerifier,
    state
  };
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code, codeVerifier) {
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      code: code,
      grant_type: 'authorization_code',
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT_URI,
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  
  // Calculate expiration timestamp
  const expiresAt = Date.now() + (data.expires_in * 1000);
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    scope: data.scope,
    token_type: data.token_type
  };
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: TWITTER_CLIENT_ID
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + (data.expires_in * 1000);
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // Twitter may return new refresh token
    expires_at: expiresAt,
    scope: data.scope,
    token_type: data.token_type
  };
}

/**
 * Get valid access token for a user (refresh if needed)
 */
async function getValidAccessToken(userId) {
  let tokens = await getTokens(userId);
  
  if (!tokens) {
    throw new Error('No tokens found for user. Please authenticate first.');
  }

  // Check if token is expired (with 5 minute buffer)
  const fiveMinutes = 5 * 60 * 1000;
  if (Date.now() >= (tokens.expires_at - fiveMinutes)) {
    console.log('Token expired or expiring soon, refreshing...');
    tokens = await refreshAccessToken(tokens.refresh_token);
    await storeTokens(userId, tokens);
  }

  return tokens.access_token;
}

/**
 * Get Twitter user info
 */
async function getTwitterUserInfo(accessToken) {
  const response = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get user info: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Post a tweet
 */
async function postTweet(accessToken, text) {
  if (text.length > 280) {
    throw new Error('Tweet text exceeds 280 characters');
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to post tweet: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data;
}

module.exports = {
  initiateOAuth,
  exchangeCodeForToken,
  refreshAccessToken,
  getValidAccessToken,
  getTwitterUserInfo,
  postTweet
};

