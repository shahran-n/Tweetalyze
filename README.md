# 🐦 Tweetalyze

A powerful Twitter/X analytics dashboard that provides insights into user activity, engagement metrics, and tweet analysis. Built with React, Node and Express.


## Features

### User Analytics 📊 
- **Profile Metrics**: Followers, following, tweet count, and verification status
- **Engagement Stats**: Likes, retweets, and average tweet length
- **Activity Frequency**: Tweets per day calculation
- **Word Cloud Analysis**: Top 20 most used words in recent tweets
- **Media Breakdown**: Visual distribution of photos, videos, GIFs, links, and text-only tweets


### Tweet Generator 🤖
- **OAuth 2.0 Authentication**: Secure Twitter/X account connection with write access
- **AI-Powered Generation**: GPT-based tweet generation from prompts
- **Customizable Options**: Control tone, style, and hashtag usage
- **Multiple Variations**: Generate multiple tweet options at once
- **Direct Posting**: Post generated tweets directly to Twitter/X
- **Secure Token Storage**: OAuth tokens securely stored in Firestore


## 🛠️ Tech Stack

**Frontend:**
- React 17
- Vanilla CSS with responsive design
- Hash-based routing

**Backend:**
- Node.js
- Express
- Twitter/X API v2
- Firebase Admin SDK (Firestore)
- OpenAI API (GPT)
- OAuth 2.0 (PKCE flow)
- In-memory caching

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Twitter/X API Bearer Token ([Get one here](https://developer.x.com/en/portal/dashboard))
- Twitter/X OAuth 2.0 credentials ([Get them here](https://developer.x.com/en/portal/dashboard))
- Firebase project with Firestore enabled ([Get started here](https://firebase.google.com/))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

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

# Twitter/X OAuth 2.0 Configuration (for tweet posting)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://127.0.0.1:8080/twitter/callback
# Alternative: Use ngrok for a public URL (see troubleshooting section)
# TWITTER_REDIRECT_URI=https://your-ngrok-url.ngrok.io/twitter/callback

# Firebase Configuration (for storing OAuth tokens)
# Option 1: Service account JSON (recommended for production)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
# Option 2: Just project ID (uses default credentials if running on GCP/Firebase)
# FIREBASE_PROJECT_ID=your-firebase-project-id

# OpenAI Configuration (for tweet generation)
OPENAI_API_KEY=your_openai_api_key

# Session Secret (for OAuth state management)
SESSION_SECRET=your_random_session_secret_here

# Base URL (for OAuth redirect)
BASE_URL=http://localhost:8080
PORT=8080
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (Native mode)
3. Get your service account credentials:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Copy the JSON and paste it as a single-line string in `FIREBASE_SERVICE_ACCOUNT` (escape quotes properly)
   - OR set `FIREBASE_PROJECT_ID` if using default credentials

### Twitter OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Go to "Keys and tokens" tab
4. Under "OAuth 2.0 Client ID and Client Secret":
   - Copy the Client ID → `TWITTER_CLIENT_ID`
   - Copy the Client Secret → `TWITTER_CLIENT_SECRET`
5. Under "App settings", add:
   - **Website URL**: `http://127.0.0.1:8080` (your app's base URL, not the callback path)
     - OR with ngrok: `https://your-ngrok-url.ngrok.io` (recommended for local testing)
     - Production: Your production domain
   - **Callback URI / Redirect URL**: `http://127.0.0.1:8080/twitter/callback`
     - OR with ngrok: `https://your-ngrok-url.ngrok.io/twitter/callback`
     - Production: Your production URL + `/twitter/callback`
6. Enable OAuth 2.0 and request "Read and Write" permissions

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

### Tweet Generator Issues

**OAuth Authentication Fails:**
- Verify `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are correct
- Check that callback URL matches exactly in Twitter app settings
- Try using `127.0.0.1` instead of `localhost` if localhost is rejected
- For local development, consider using ngrok to create a public URL:
  1. Install ngrok: `npm install -g ngrok` or download from [ngrok.com](https://ngrok.com/)
  2. Run: `ngrok http 8080`
  3. Use the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io/twitter/callback`)
  4. Add this URL to both Twitter app settings and your `.env` file
- Ensure your Twitter app has "Read and Write" permissions enabled
- Check browser console for detailed error messages

**Firebase/Firestore Errors:**
- Verify your `FIREBASE_SERVICE_ACCOUNT` JSON is valid and properly escaped
- OR set `FIREBASE_PROJECT_ID` if using default credentials
- Ensure Firestore is enabled in your Firebase project
- Check that your service account has proper permissions

**OpenAI Generation Fails:**
- Verify `OPENAI_API_KEY` is correct
- Check your OpenAI account has sufficient credits
- Review API rate limits in OpenAI dashboard

**Tokens Not Persisting:**
- Check Firestore connection by viewing your Firebase console
- Verify service account has "Cloud Datastore User" role
- Check server logs for Firestore errors

---
