const fetch = require('node-fetch');
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

/**
 * Fetch top headlines from News API
 * @param {Object} options - Query options
 */
async function fetchTopHeadlines(options = {}) {
  try {
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not configured in environment variables');
    }

    const {
      country = 'us',
      category = null,
      sources = null,
      pageSize = 100,
      page = 1
    } = options;

    const url = new URL(`${NEWS_API_BASE_URL}/top-headlines`);
    
    if (sources) {
      url.searchParams.set('sources', sources);
    } else if (category) {
      url.searchParams.set('category', category);
      url.searchParams.set('country', country);
    } else {
      url.searchParams.set('country', country);
    }
    
    url.searchParams.set('pageSize', Math.min(pageSize, 100)); // API limit
    url.searchParams.set('page', page);
    url.searchParams.set('apiKey', NEWS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `News API error: ${response.status}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'News API returned an error');
    }

    return {
      articles: data.articles || [],
      totalResults: data.totalResults || 0,
      page: data.page || 1
    };
  } catch (error) {
    console.error('Error fetching top headlines:', error);
    throw error;
  }
}

/**
 * Search news articles by keyword
 * @param {Object} options - Query options
 */
async function searchNews(options = {}) {
  try {
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not configured in environment variables');
    }

    const {
      q,
      language = 'en',
      sortBy = 'publishedAt',
      pageSize = 100,
      page = 1
    } = options;

    if (!q) {
      throw new Error('Search query (q) is required');
    }

    const url = new URL(`${NEWS_API_BASE_URL}/everything`);
    url.searchParams.set('q', q);
    url.searchParams.set('language', language);
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('pageSize', Math.min(pageSize, 100));
    url.searchParams.set('page', page);
    url.searchParams.set('apiKey', NEWS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `News API error: ${response.status}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'News API returned an error');
    }

    return {
      articles: data.articles || [],
      totalResults: data.totalResults || 0,
      page: data.page || 1
    };
  } catch (error) {
    console.error('Error searching news:', error);
    throw error;
  }
}

/**
 * Get available news sources
 * @param {Object} options - Query options
 */
async function getSources(options = {}) {
  try {
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY not configured in environment variables');
    }

    const {
      category = null,
      language = 'en',
      country = null
    } = options;

    const url = new URL(`${NEWS_API_BASE_URL}/sources`);
    
    if (category) url.searchParams.set('category', category);
    if (language) url.searchParams.set('language', language);
    if (country) url.searchParams.set('country', country);
    url.searchParams.set('apiKey', NEWS_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `News API error: ${response.status}`);
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'News API returned an error');
    }

    return data.sources || [];
  } catch (error) {
    console.error('Error fetching sources:', error);
    throw error;
  }
}

/**
 * Normalize article data for consistent storage
 * @param {Object} article - Raw article from News API
 */
function normalizeArticle(article) {
  return {
    id: article.url || article.title?.slice(0, 50), // Use URL as ID
    title: article.title || '',
    description: article.description || '',
    content: article.content || article.description || '',
    url: article.url || '',
    source: article.source?.name || article.source || 'Unknown',
    author: article.author || 'Unknown',
    publishedAt: article.publishedAt,
    urlToImage: article.urlToImage || null
  };
}

module.exports = {
  fetchTopHeadlines,
  searchNews,
  getSources,
  normalizeArticle
};

