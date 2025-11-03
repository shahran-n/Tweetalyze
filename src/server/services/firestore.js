const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Try to use service account from environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use default credentials if running on Firebase or GCP
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      // Fallback: try to use application default credentials
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    console.error('Full error:', error);
    // Don't throw if Firebase isn't critical - OAuth will work but tokens won't persist
    console.warn('WARNING: Firebase not initialized. OAuth tokens will not persist across server restarts.');
  }
}

let db;
try {
  db = admin.apps.length > 0 ? admin.firestore() : null;
} catch (error) {
  console.error('Failed to get Firestore instance:', error);
  db = null;
}

// Token storage functions
const TOKENS_COLLECTION = 'twitter_tokens';

/**
 * Store Twitter OAuth tokens for a user
 * @param {string} userId - User identifier (could be Twitter user ID or session ID)
 * @param {Object} tokens - { access_token, refresh_token, expires_at, scope }
 */
async function storeTokens(userId, tokens) {
  try {
    if (!db) {
      throw new Error('Firestore database not initialized. Check Firebase configuration.');
    }
    await db.collection(TOKENS_COLLECTION).doc(userId).set({
      ...tokens,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Tokens stored for user: ${userId}`);
  } catch (error) {
    console.error('Error storing tokens:', error);
    console.error('Make sure Firestore is enabled and properly configured.');
    throw error;
  }
}

/**
 * Retrieve Twitter OAuth tokens for a user
 * @param {string} userId - User identifier
 * @returns {Object|null} Tokens object or null if not found
 */
async function getTokens(userId) {
  try {
    const doc = await db.collection(TOKENS_COLLECTION).doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data();
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    throw error;
  }
}

/**
 * Delete tokens for a user
 * @param {string} userId - User identifier
 */
async function deleteTokens(userId) {
  try {
    await db.collection(TOKENS_COLLECTION).doc(userId).delete();
    console.log(`Tokens deleted for user: ${userId}`);
  } catch (error) {
    console.error('Error deleting tokens:', error);
    throw error;
  }
}

module.exports = {
  storeTokens,
  getTokens,
  deleteTokens
};

