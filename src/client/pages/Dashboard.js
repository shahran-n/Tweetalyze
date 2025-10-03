import React from 'react';

const Metric = ({ title, color, value }) => (
  <div className={`metric-card ${color}`}>
    <div>
      <div className="metric-title">{title}</div>
      {typeof value !== 'undefined' && <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value}</div>}
    </div>
  </div>
);

export default function Dashboard({ searchQuery, searchData, searchLoading, searchError, userProfile }) {
  const followers = userProfile && userProfile.followers;
  const following = userProfile && userProfile.following;
  const likes = searchData && searchData.analytics && searchData.analytics.likes;
  const retweets = searchData && searchData.analytics && searchData.analytics.retweets;
  const tweetsPerDay = searchData && searchData.analytics && searchData.analytics.tweets_per_day;
  const sentimentScore = searchData && searchData.analytics && searchData.analytics.sentiment_score;
  
  return (
    <div>
      <div className="cards-grid">
        {/* <Metric title="Sample Size" color="blue" value={sampleSize} /> */}
        <Metric title="Followers" color="yellow" value={followers} />
        <Metric title="Following" color="blue" value={following} />
        <Metric title="Frequency (Tweets/Day)" color="red" value={tweetsPerDay} />
        <Metric title="Retweets" color="purple" value={retweets} />
        <Metric title="Likes" color="green" value={likes} />
        <Metric title="Sentiment Score" color="yellow" />
      </div>

      <div className="panels">
        <div className="panel">
          <div className="panel-header">Sample Composition (%)</div>
          <div className="panel-body" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topWords && topWords.length > 0 ? (
              topWords.slice(0, 10).map((item, i) => {
                const percentage = Math.round((item.count / topWords[0].count) * 100);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.word}</span>
                    <span style={{ fontWeight: 600, color: '#3b5bdb' }}>{percentage}%</span>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#6b7280' }}>No data available</div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">Word Cloud (Last User Only)</div>
          <div className="panel-body" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {topWords && topWords.length > 0 ? (
              topWords.slice(0, 15).map((item, i) => {
                const size = Math.max(12, Math.min(24, 12 + (item.count * 2)));
                return (
                  <span
                    key={i}
                    style={{
                      fontSize: size,
                      fontWeight: 600,
                      color: i < 5 ? '#3b5bdb' : i < 10 ? '#6366f1' : '#9ca3af',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: i < 5 ? '#eef2ff' : '#f9fafb'
                    }}
                  >
                    {item.word}
                  </span>
                );
              })
            ) : (
              <div style={{ color: '#6b7280' }}>No data available</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }} className="panel">
        <div className="panel-header">Search Results</div>
        <div className="panel-body" style={{ overflow: 'auto', padding: 14, height: 320 }}>
          {!searchQuery && <div>Enter a handle or query above and press Enter.</div>}
          {searchQuery && (
            <div style={{ marginBottom: 8 }}>
              <strong>Query:</strong> {searchQuery}
            </div>
          )}
          {searchLoading && <div>Loading...</div>}
          {searchError && <div style={{ color: '#ef4444' }}>{searchError}</div>}
          {searchData && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong>Results:</strong> {Array.isArray(searchData.data) ? searchData.data.length : 0}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                {(searchData.data || []).map(t => (
                  <li key={t.id} style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: 12, background: '#fff' }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{t.id}</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{t.text}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


