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
  const sampleSize = searchData && searchData.analytics ? searchData.analytics.recent_sample_size : (Array.isArray(searchData && searchData.data) ? searchData.data.length : undefined);
  const likes = searchData && searchData.analytics && searchData.analytics.likes;
  const retweets = searchData && searchData.analytics && searchData.analytics.retweets;
  const tweetsPerDay = searchData && searchData.analytics && searchData.analytics.tweets_per_day;
  return (
    <div>
      <div className="cards-grid">
        <Metric title="Sample Size" color="blue" value={sampleSize} />
        <Metric title="Followers" color="purple" value={followers} />
        <Metric title="Following" color="yellow" value={following} />
        <Metric title="Frequency (Tweets/Day)" color="teal" value={tweetsPerDay} />
        <Metric title="Length (Characters)" color="blue" />
        <Metric title="Sample Unique Words" color="yellow" />
        <Metric title="Retweets" color="green" value={retweets} />
        <Metric title="Likes" color="red" value={likes} />
        <Metric title="Sentiment Score" color="yellow" />
      </div>

      <div className="panels">
        <div className="panel">
          <div className="panel-header">Sample Composition (%)</div>
          <div className="panel-body" />
        </div>
        <div className="panel">
          <div className="panel-header">Word Cloud (Last User Only)</div>
          <div className="panel-body" />
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


