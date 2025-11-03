const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate a tweet based on a prompt
 * @param {string} prompt - The prompt/instruction for generating the tweet
 * @param {Object} options - Additional options (tone, length, etc.)
 * @returns {Promise<string>} Generated tweet text
 */
async function generateTweet(prompt, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in environment variables.');
  }

  const {
    tone = 'engaging',
    maxLength = 280,
    style = 'natural',
    includeHashtags = false
  } = options;

  const systemPrompt = `You are a creative Twitter/X content generator. Generate tweets that are:
- Maximum ${maxLength} characters
- ${tone} in tone
- ${style} in style
- Engaging and authentic
${includeHashtags ? '- Include 1-2 relevant hashtags when appropriate' : '- No hashtags unless specifically requested'}
- Follow Twitter/X best practices
- Ready to post (no placeholders or incomplete thoughts)
- Use text-based emoticons like :) :( :P :D ;) instead of emojis
- When expressing emotions, use emoticons such as :) for happy, :( for sad, :D for excited, :P for playful, ;) for winking, etc.

IMPORTANT: 
- The tweet must be exactly ready to post - it should be complete, coherent, and exactly ${maxLength} characters or less
- Do not include any explanations, metadata, or notes
- Use text emoticons (:) :( :P etc.) NOT emoji characters`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for cost-effectiveness, can be changed to gpt-4 if needed
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: Math.floor(maxLength / 2), // Rough estimate: 1 token ≈ 2 characters
      temperature: 0.8, // Creative but controlled
    });

    let tweet = response.choices[0].message.content.trim();
    
    // Clean up any quotes or markdown formatting
    tweet = tweet.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    tweet = tweet.replace(/^```\w*\n|```$/g, ''); // Remove code blocks
    tweet = tweet.trim();

    // Ensure it's within character limit
    if (tweet.length > maxLength) {
      tweet = tweet.substring(0, maxLength - 3) + '...';
    }

    return tweet;
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error.message.includes('API key')) {
      throw new Error('OpenAI API key is invalid or not configured');
    }
    throw new Error(`Failed to generate tweet: ${error.message}`);
  }
}

/**
 * Generate multiple tweet variations
 * @param {string} prompt - The prompt/instruction
 * @param {number} count - Number of variations to generate
 * @param {Object} options - Additional options
 * @returns {Promise<string[]>} Array of generated tweets
 */
async function generateTweetVariations(prompt, count = 3, options = {}) {
  const tweets = [];
  for (let i = 0; i < count; i++) {
    try {
      const tweet = await generateTweet(prompt, { ...options, temperature: 0.8 + (i * 0.1) });
      tweets.push(tweet);
    } catch (error) {
      console.error(`Error generating tweet variation ${i + 1}:`, error);
      // Continue with other variations even if one fails
    }
  }
  return tweets;
}

module.exports = {
  generateTweet,
  generateTweetVariations
};

