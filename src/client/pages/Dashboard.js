import React from 'react';

const Metric = ({ title, color, value }) => (
  <div className={`metric-card ${color}`}>
    <div>
      <div className="metric-title">{title}</div>
      {typeof value !== 'undefined' && value !== null && <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value}</div>}
    </div>
  </div>
);

export default function Dashboard({ searchQuery, searchData, searchLoading, searchError, userProfile }) {
  const followers = userProfile?.followers;
  const following = userProfile?.following;
  const likes = searchData?.analytics?.likes;
  const retweets = searchData?.analytics?.retweets;
  const tweetsPerDay = searchData?.analytics?.tweets_per_day;
  const topWords = searchData?.analytics?.top_words;
  const sampleSize = searchData?.analytics?.recent_sample_size;
  const avgTweetLength = searchData?.analytics?.avg_tweet_length;
  const uniqueWords = searchData?.analytics?.unique_words;
  
  return (
    <div>
      <div className="cards-grid">
        <Metric title="Followers" color="yellow" value={followers} />
        <Metric title="Following" color="blue" value={following} />
        <Metric title="Frequency (Tweets/Day)" color="red" value={tweetsPerDay} />
        <Metric title="Retweets" color="purple" value={retweets} />
        <Metric title="Likes" color="green" value={likes} />
        <Metric title="Avg Tweet Length" color="yellow" value={avgTweetLength} />
      </div>

      <div className="panels">
        <div className="panel">
          <div className="panel-header">Top Words Used</div>
          <div className="panel-body" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
            {searchLoading ? (
              <div style={{ color: '#6b7280' }}>Loading...</div>
            ) : topWords && topWords.length > 0 ? (
              topWords.slice(0, 10).map((item, i) => {
                const maxCount = topWords[0].count;
                const percentage = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>{item.word}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: '80px', 
                        height: '6px', 
                        backgroundColor: '#f3f4f6',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: '#3b5bdb',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#3b5bdb', fontSize: 13, minWidth: 35, textAlign: 'right' }}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#6b7280' }}>No data available. Search for a user above.</div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">Media Breakdown</div>
          <div className="panel-body" style={{ padding: 14, overflow: 'auto' }}>
            {searchLoading ? (
              <div style={{ color: '#6b7280' }}>Loading...</div>
            ) : searchData?.analytics?.media_breakdown ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(searchData.analytics.media_breakdown).map(([type, count]) => {
                  const total = Object.values(searchData.analytics.media_breakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const barColor = {
                    'photo': '#4ade80',
                    'video': '#3b82f6',
                    'gif': '#8b5cf6',
                    'link': '#f59e0b',
                    'text_only': '#6b7280'
                  }[type] || '#6b7280';
                  
                  return count > 0 && (
                    <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                          {type.replace('_', ' ')}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {count} ({percentage}%)
                        </span>
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
              <div style={{ color: '#6b7280' }}>No data available. Search for a user above.</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }} className="panel">
        <div className="panel-header">
          Recent Tweets
          {sampleSize && <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 13 }}>({sampleSize} tweets)</span>}
        </div>
        <div className="panel-body" style={{ overflow: 'auto', padding: 14, height: 320 }}>
          {!searchQuery && !searchLoading && (
            <div style={{ color: '#6b7280' }}>
              Enter a Twitter handle above and click "Generate Report" to see analytics.
            </div>
          )}
          {searchLoading && (
            <div style={{ color: '#6b7280' }}>Loading tweets...</div>
          )}
          {searchError && (
            <div style={{ color: '#ef4444', padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
              <strong>Error:</strong> {searchError}
            </div>
          )}
          {searchData && searchData.data && (
            <div>
              {userProfile && (
                <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {userProfile.profile_image_url && (
                    <img 
                      src={userProfile.profile_image_url} 
                      alt={userProfile.name}
                      style={{ width: 48, height: 48, borderRadius: '50%' }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{userProfile.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 14 }}>@{userProfile.username}</div>
                    {userProfile.description && (
                      <div style={{ marginTop: 4, fontSize: 13, color: '#4b5563' }}>{userProfile.description}</div>
                    )}
                  </div>
                </div>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                {(searchData.data || []).map(t => (
                  <li key={t.id} style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: 12, background: '#fff' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                      {t.created_at ? new Date(t.created_at).toLocaleString() : t.id}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{t.text}</div>
                    {t.public_metrics && (
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                        <span>💬 {t.public_metrics.reply_count || 0}</span>
                        <span>🔄 {t.public_metrics.retweet_count || 0}</span>
                        <span>❤️ {t.public_metrics.like_count || 0}</span>
                      </div>
                    )}
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