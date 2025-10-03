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
  const topWords = searchData && searchData.analytics && searchData.analytics.top_words;
  
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
          <div className="panel-header">Media Breakdown</div>
          <div className="panel-body" style={{ padding: 14 }}>
            {searchData?.analytics?.media_breakdown ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(searchData.analytics.media_breakdown).map(([type, count]) => {
                  const total = Object.values(searchData.analytics.media_breakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const barColor = {
                    'photo': '#4ade80',  // green
                    'video': '#3b82f6',  // blue
                    'gif': '#8b5cf6',    // purple
                    'link': '#f59e0b',   // amber
                    'text_only': '#6b7280' // gray
                  }[type] || '#6b7280';
                  
                  return count > 0 && (
                    <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                        <span style={{ fontWeight: 600 }}>{count} ({percentage}%)</span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: barColor,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
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


