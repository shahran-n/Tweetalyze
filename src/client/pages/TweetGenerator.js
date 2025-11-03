import React from 'react';

export default function TweetGenerator() {
  const [prompt, setPrompt] = React.useState('');
  const [generatedTweets, setGeneratedTweets] = React.useState([]);
  const [selectedTweet, setSelectedTweet] = React.useState('');
  const [generating, setGenerating] = React.useState(null); // null, 'single', or 'variations'
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [options, setOptions] = React.useState({
    tone: 'engaging',
    maxLength: 280,
    style: 'natural',
    includeHashtags: false
  });

  const generateTweet = async (variations = false) => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setGenerating(variations ? 'variations' : 'single');
      setError('');
      setSuccess('');
      setGeneratedTweets([]);
      setSelectedTweet('');

      const endpoint = variations ? '/api/tweets/generate-variations' : '/api/tweets/generate';
      const body = variations 
        ? { prompt, count: 3, options }
        : { prompt, options };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tweet');
      }

      if (variations) {
        setGeneratedTweets(data.tweets || []);
        if (data.tweets && data.tweets.length > 0) {
          setSelectedTweet(data.tweets[0]);
        }
      } else {
        setGeneratedTweets([data.tweet]);
        setSelectedTweet(data.tweet);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError(error.message || 'Failed to generate tweet');
    } finally {
      setGenerating(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: '24px',
      paddingTop: '150px'
    }}>
      <h1 style={{
        margin: '0 0 24px 0',
        fontSize: '32px',
        fontWeight: 700,
        color: '#1f2937',
        letterSpacing: '-0.5px'
      }}>
        Generate a Tweet!
      </h1>
      {/* Input Section */}
      <div style={{ 
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        padding: '32px',
        // paddingBottom: '108px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 12, 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#374151',
            letterSpacing: '0.2px'
          }}>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to tweet about?"
            style={{
              width: '100%',
              minHeight: 120,
              padding: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '15px',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'all 0.2s',
              outline: 'none',
              lineHeight: '1.6'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: 16,
          marginBottom: 24
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: '13px', 
              fontWeight: 600,
              color: '#4b5563' 
            }}>
              Tone
            </label>
            <select
              value={options.tone}
              onChange={(e) => setOptions({ ...options, tone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="engaging">Engaging</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="humorous">Humorous</option>
              <option value="inspiring">Inspiring</option>
              <option value="informative">Informative</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontSize: '13px', 
              fontWeight: 600,
              color: '#4b5563' 
            }}>
              Style
            </label>
            <select
              value={options.style}
              onChange={(e) => setOptions({ ...options, style: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="natural">Natural</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
              <option value="conversational">Conversational</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: '10px 12px',
              background: '#f9fafb',
              borderRadius: '10px',
              border: '2px solid #e5e7eb',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <input
                type="checkbox"
                checked={options.includeHashtags}
                onChange={(e) => setOptions({ ...options, includeHashtags: e.target.checked })}
                style={{ 
                  marginRight: 10,
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Include hashtags
              </span>
            </label>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 12, 
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 'auto'
        }}>
          <button
            onClick={() => generateTweet(false)}
            disabled={generating !== null || !prompt.trim()}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: generating !== null || !prompt.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: generating !== null || !prompt.trim() ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (generating === null && prompt.trim()) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = generating !== null || !prompt.trim() ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.2)';
            }}
          >
            {generating === 'single' ? 'Generating...' : 'Generate Tweet'}
          </button>
          <button
            onClick={() => generateTweet(true)}
            disabled={generating !== null || !prompt.trim()}
            style={{
              padding: '12px 24px',
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: generating !== null || !prompt.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: generating !== null || !prompt.trim() ? 'none' : '0 2px 4px rgba(99, 102, 241, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (generating === null && prompt.trim()) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = generating !== null || !prompt.trim() ? 'none' : '0 2px 4px rgba(99, 102, 241, 0.2)';
            }}
          >
            {generating === 'variations' ? 'Generating...' : 'Generate Variations'}
          </button>
        </div>
      </div>

      {/* Generated Tweets Section */}
      {generatedTweets.length > 0 && (
        <div style={{ 
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '32px',
        //   paddingBottom: '70px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          width: '100%',
          maxWidth: '800px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '2px solid #f3f4f6'
          }}>
            <h2 style={{ 
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: '#1f2937'
            }}>
              {generatedTweets.length > 1 ? 'Generated Variations' : 'Generated Tweet'}
            </h2>
          </div>

          {generatedTweets.length > 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {generatedTweets.map((tweet, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '14px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onClick={() => setSelectedTweet(tweet)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#1f2937', 
                    lineHeight: 1.7,
                    marginBottom: 12,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {tweet}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      fontSize: '13px', 
                      color: '#9ca3af',
                      fontWeight: 500
                    }}>
                      {tweet.length} characters
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(tweet);
                      }}
                      style={{
                        padding: '6px 16px',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#374151',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#3b82f6';
                        e.target.style.color = '#ffffff';
                        e.target.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#f3f4f6';
                        e.target.style.color = '#374151';
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '20px',
                border: '2px solid #e5e7eb',
                borderRadius: '14px',
                background: '#ffffff',
                position: 'relative'
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  color: '#1f2937',
                  lineHeight: 1.7,
                  marginBottom: 12,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedTweet}
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: '13px', 
                  color: '#9ca3af',
                  fontWeight: 500
                }}>
                  {selectedTweet.length} characters
                </span>
                <button
                  onClick={() => copyToClipboard(selectedTweet)}
                  style={{
                    padding: '6px 16px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#3b82f6';
                    e.target.style.color = '#ffffff';
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.color = '#374151';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div style={{
          padding: '16px 20px',
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '12px',
          color: '#dc2626',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span style={{ fontSize: '20px' }}>!</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 4 }}>Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div style={{
          padding: '16px 20px',
          background: '#f0fdf4',
          border: '2px solid #bbf7d0',
          borderRadius: '12px',
          color: '#059669',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <span style={{ fontSize: '20px' }}>✓</span>
          <strong>{success}</strong>
        </div>
      )}
    </div>
  );
}
