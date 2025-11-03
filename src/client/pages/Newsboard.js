import React from 'react';

const Metric = ({ title, color, value, subtitle }) => (
  <div className={`metric-card ${color}`}>
    <div>
      <div className="metric-title">{title}</div>
      {typeof value !== 'undefined' && value !== null && (
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value}</div>
      )}
      {subtitle && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  </div>
);

export default function Newsboard() {
  const [stats, setStats] = React.useState(null);
  const [articles, setArticles] = React.useState([]);
  const [anomalies, setAnomalies] = React.useState([]);
  const [metrics, setMetrics] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [timeRange, setTimeRange] = React.useState(24);
  
  // Get mode from localStorage or default to 'real'
  const [useMockData, setUseMockData] = React.useState(() => {
    const saved = localStorage.getItem('newsboard_use_mock_data');
    return saved === 'true';
  });

  // Fetch dashboard data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (useMockData) {
        // Fetch mock data
        const mockRes = await fetch('/api/newsboard/mock-preview');
        if (!mockRes.ok) {
          throw new Error('Failed to fetch mock data');
        }
        const mockData = await mockRes.json();
        
        setStats(mockData.stats);
        setArticles(mockData.articles || []);
        setAnomalies(mockData.anomalies || []);
        setMetrics(mockData.metrics || []);
      } else {
        // Fetch real data
        const [statsRes, articlesRes, anomaliesRes, metricsRes] = await Promise.all([
          fetch(`/api/newsboard/stats?hours=${timeRange}`),
          fetch(`/api/newsboard/recent?hours=${timeRange}&limit=20`),
          fetch(`/api/newsboard/anomalies?limit=10`),
          fetch(`/api/newsboard/metrics?hours=${timeRange}`)
        ]);

        // Parse responses and check for errors
        const [statsData, articlesData, anomaliesData, metricsData] = await Promise.all([
          statsRes.json().catch(() => ({ error: 'Failed to parse stats response' })),
          articlesRes.json().catch(() => ({ error: 'Failed to parse articles response' })),
          anomaliesRes.json().catch(() => ({ error: 'Failed to parse anomalies response' })),
          metricsRes.json().catch(() => ({ error: 'Failed to parse metrics response' }))
        ]);

        // Check for API errors in responses
        if (!statsRes.ok || statsData.error) {
          throw new Error(statsData.error || `Stats API error: ${statsRes.status} ${statsRes.statusText}`);
        }
        if (!articlesRes.ok || articlesData.error) {
          throw new Error(articlesData.error || `Articles API error: ${articlesRes.status} ${articlesRes.statusText}`);
        }
        if (!anomaliesRes.ok || anomaliesData.error) {
          throw new Error(anomaliesData.error || `Anomalies API error: ${anomaliesRes.status} ${anomaliesRes.statusText}`);
        }
        if (!metricsRes.ok || metricsData.error) {
          throw new Error(metricsData.error || `Metrics API error: ${metricsRes.status} ${metricsRes.statusText}`);
        }

        setStats(statsData);
        setArticles(articlesData.articles || []);
        setAnomalies(anomaliesData.anomalies || []);
        setMetrics(metricsData.metrics || []);
      }
    } catch (err) {
      console.error('Error fetching newsboard data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, useMockData]);

  // Toggle between mock and real data
  const toggleDataMode = () => {
    const newMode = !useMockData;
    setUseMockData(newMode);
    localStorage.setItem('newsboard_use_mock_data', newMode.toString());
    // Force immediate refetch with new mode
    setLoading(true);
    
    // Fetch with new mode directly
    if (newMode) {
      // Fetch mock data
      fetch('/api/newsboard/mock-preview')
        .then(async (mockRes) => {
          if (!mockRes.ok) {
            throw new Error('Failed to fetch mock data');
          }
          const mockData = await mockRes.json();
          setStats(mockData.stats);
          setArticles(mockData.articles || []);
          setAnomalies(mockData.anomalies || []);
          setMetrics(mockData.metrics || []);
          setError('');
        })
        .catch((err) => {
          console.error('Error fetching mock data:', err);
          setError(err.message || 'Failed to load mock data');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Fetch real data
      Promise.all([
        fetch(`/api/newsboard/stats?hours=${timeRange}`),
        fetch(`/api/newsboard/recent?hours=${timeRange}&limit=20`),
        fetch(`/api/newsboard/anomalies?limit=10`),
        fetch(`/api/newsboard/metrics?hours=${timeRange}`)
      ])
        .then(async ([statsRes, articlesRes, anomaliesRes, metricsRes]) => {
          const [statsData, articlesData, anomaliesData, metricsData] = await Promise.all([
            statsRes.json().catch(() => ({ error: 'Failed to parse stats response' })),
            articlesRes.json().catch(() => ({ error: 'Failed to parse articles response' })),
            anomaliesRes.json().catch(() => ({ error: 'Failed to parse anomalies response' })),
            metricsRes.json().catch(() => ({ error: 'Failed to parse metrics response' }))
          ]);

          if (!statsRes.ok || statsData.error) {
            throw new Error(statsData.error || `Stats API error: ${statsRes.status}`);
          }
          if (!articlesRes.ok || articlesData.error) {
            throw new Error(articlesData.error || `Articles API error: ${articlesRes.status}`);
          }
          if (!anomaliesRes.ok || anomaliesData.error) {
            throw new Error(anomaliesData.error || `Anomalies API error: ${anomaliesRes.status}`);
          }
          if (!metricsRes.ok || metricsData.error) {
            throw new Error(metricsData.error || `Metrics API error: ${metricsRes.status}`);
          }

          setStats(statsData);
          setArticles(articlesData.articles || []);
          setAnomalies(anomaliesData.anomalies || []);
          setMetrics(metricsData.metrics || []);
          setError('');
        })
        .catch((err) => {
          console.error('Error fetching real data:', err);
          setError(err.message || 'Failed to load data');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  React.useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds (only in real mode)
    if (!useMockData) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchData, useMockData]);

  const formatSentiment = (score) => {
    if (score === null || score === undefined) return 'N/A';
    if (score > 0.1) return 'Positive';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
  };

  const getSentimentColor = (score) => {
    if (score === null || score === undefined) return '#6b7280';
    if (score > 0.1) return '#10b981'; // green
    if (score < -0.1) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        Loading newsboard data...
      </div>
    );
  }

  // Safety checks for stats
  const latestMetrics = stats?.latest_metrics || null;
  const volumeTrend = stats?.volume_trend || [];
  const totalArticles = stats?.total_articles || 0;
  const totalAnomalies = stats?.total_anomalies || 0;
  const totalSources = stats?.total_sources || 0;
  const avgSentiment = stats?.avg_sentiment;
  const anomalyRate = stats?.anomaly_rate || 0;

  return (
    <div>
      {/* Controls Bar */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 500, color: '#374151' }}>Time Range:</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          disabled={useMockData}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 14,
            opacity: useMockData ? 0.6 : 1
          }}
        >
          <option value={1}>Last Hour</option>
          <option value={6}>Last 6 Hours</option>
          <option value={24}>Last 24 Hours</option>
          <option value={48}>Last 2 Days</option>
          <option value={168}>Last Week</option>
        </select>
        
        {/* Refresh and Mock Toggle buttons together */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button
            onClick={toggleDataMode}
            disabled={loading}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: useMockData ? '#f59e0b' : '#6366f1',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1
            }}
          >
            {useMockData ? 'Mock' : 'Real'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 12,
          marginBottom: 20,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#dc2626'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="cards-grid">
        <Metric
          title="Total Articles"
          color="blue"
          value={totalArticles}
          subtitle={`From ${totalSources} sources`}
        />
        <Metric
          title="Anomalies Detected"
          color="red"
          value={totalAnomalies}
          subtitle={`${anomalyRate.toFixed(1)}% of articles`}
        />
        <Metric
          title="Avg Sentiment"
          color="green"
          value={formatSentiment(avgSentiment)}
          subtitle={avgSentiment !== null && avgSentiment !== undefined ? avgSentiment.toFixed(2) : 'N/A'}
        />
        <Metric
          title="Unique Sources"
          color="purple"
          value={totalSources}
        />
      </div>

      {/* Visual Insights Section */}
      {metrics && metrics.length > 0 && articles.length > 0 && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
          
          {/* Sentiment Over Time X-Y Graph */}
          <div className="panel">
            <div className="panel-header">Sentiment Over Time</div>
            <div className="panel-body" style={{ padding: 20 }}>
              {(() => {
                const validMetrics = metrics
                  .filter(m => m && m.avg_sentiment !== null && m.avg_sentiment !== undefined)
                  .slice(-24); // Last 24 hours
                
                if (validMetrics.length === 0) {
                  return <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>No sentiment data available</div>;
                }

                const chartWidth = 600;
                const chartHeight = 250;
                const padding = { top: 20, right: 20, bottom: 40, left: 40 };
                const graphWidth = chartWidth - padding.left - padding.right;
                const graphHeight = chartHeight - padding.top - padding.bottom;

                // Calculate Y-axis range (sentiment: -1 to 1)
                const minSentiment = -1;
                const maxSentiment = 1;
                const sentimentRange = maxSentiment - minSentiment;

                // Map sentiment to Y coordinate (inverted: top = 1, bottom = -1)
                const getY = (sentiment) => {
                  const normalized = (sentiment - minSentiment) / sentimentRange;
                  return padding.top + graphHeight - (normalized * graphHeight);
                };

                // Map index to X coordinate
                const getX = (index) => {
                  return padding.left + (index / (validMetrics.length - 1 || 1)) * graphWidth;
                };

                // Generate points and line path
                const points = validMetrics.map((metric, i) => {
                  const sentiment = Number(metric.avg_sentiment) || 0;
                  return {
                    x: getX(i),
                    y: getY(sentiment),
                    sentiment: sentiment,
                    hour: metric.hour
                  };
                });

                // Create line path
                const linePath = points.map((p, i) => 
                  `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                ).join(' ');

                return (
                  <div>
                    <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
                      {/* Grid lines */}
                      {[-1, -0.5, 0, 0.5, 1].map((val) => {
                        const y = getY(val);
                        return (
                          <g key={val}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={padding.left + graphWidth}
                              y2={y}
                              stroke="#f3f4f6"
                              strokeWidth={val === 0 ? 2 : 1}
                              strokeDasharray={val === 0 ? 'none' : '4,4'}
                            />
                            <text
                              x={padding.left - 10}
                              y={y + 4}
                              textAnchor="end"
                              fontSize="10"
                              fill="#6b7280"
                            >
                              {val === 0 ? '0' : val > 0 ? `+${val}` : val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Y-axis label */}
                      <text
                        x={15}
                        y={chartHeight / 2}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#6b7280"
                        transform={`rotate(-90, 1, ${chartHeight / 2})`}
                      >
                        Sentiment Score
                      </text>

                      {/* X-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top + graphHeight}
                        x2={padding.left + graphWidth}
                        y2={padding.top + graphHeight}
                        stroke="#e5e7eb"
                        strokeWidth={2}
                      />

                      {/* X-axis labels */}
                      {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((point, i) => {
                        const hourLabel = point.hour && typeof point.hour === 'string' 
                          ? point.hour.split('-')[3] + 'h'
                          : `${i * Math.ceil(points.length / 6)}h`;
                        return (
                          <text
                            key={i}
                            x={point.x}
                            y={chartHeight - 30}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#6b7280"
                          >
                            {hourLabel}
                          </text>
                        );
                      })}

                      {/* X-axis label */}
                      <text
                        x={chartWidth / 2}
                        y={chartHeight - 5}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#6b7280"
                      >
                        Time (Hours)
                      </text>

                      {/* Line */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Points */}
                      {points.map((point, i) => {
                        const sentiment = Number(point.sentiment) || 0;
                        const color = sentiment > 0.1 ? '#10b981' : sentiment < -0.1 ? '#ef4444' : '#6b7280';
                        return (
                          <g key={i}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={4}
                              fill={color}
                              stroke="white"
                              strokeWidth={2}
                              style={{ cursor: 'pointer' }}
                            >
                              <title>
                                {`Time: ${point.hour}\nSentiment: ${sentiment.toFixed(2)}`}
                              </title>
                            </circle>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Legend */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                        <span style={{ color: '#6b7280' }}>Negative</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#6b7280' }} />
                        <span style={{ color: '#6b7280' }}>Neutral</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ color: '#6b7280' }}>Positive</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Source Distribution Pie Chart */}
          <div className="panel">
            <div className="panel-header">Source Distribution</div>
            <div className="panel-body" style={{ padding: 20 }}>
              {(() => {
                const sourceCounts = {};
                articles.forEach(article => {
                  const source = article.source || 'Unknown';
                  sourceCounts[source] = (sourceCounts[source] || 0) + 1;
                });
                
                const sortedSources = Object.entries(sourceCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6); // Top 6 sources
                
                const total = sortedSources.reduce((sum, [, count]) => sum + count, 0);
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                
                if (sortedSources.length === 0) {
                  return <div style={{ color: '#6b7280', textAlign: 'center' }}>No source data</div>;
                }
                
                // Pie chart visualization
                let currentAngle = 0;
                const pieSegments = sortedSources.map(([source, count], i) => {
                  const percentage = (count / total) * 100;
                  const angle = (count / total) * 360;
                  const startAngle = currentAngle;
                  currentAngle += angle;
                  
                  const largeArc = angle > 180 ? 1 : 0;
                  const x1 = 100 + 70 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 100 + 70 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 100 + 70 * Math.cos((currentAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 70 * Math.sin((currentAngle - 90) * Math.PI / 180);
                  
                  return {
                    source,
                    count,
                    percentage,
                    color: colors[i % colors.length],
                    path: `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`
                  };
                });
                
                return (
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ flex: '0 0 140px', height: '140px', position: 'relative' }}>
                      <svg width="140" height="140" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                        {pieSegments.map((segment, i) => (
                          <path
                            key={i}
                            d={segment.path}
                            fill={segment.color}
                            stroke="white"
                            strokeWidth="2"
                            style={{ transition: 'opacity 0.2s' }}
                            onMouseEnter={(e) => e.target.style.opacity = 0.8}
                            onMouseLeave={(e) => e.target.style.opacity = 1}
                          />
                        ))}
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#1f2937'
                      }}>
                        {total}
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sortedSources.map(([source, count], i) => {
                        const percentage = (count / total) * 100;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 12,
                              height: 12,
                              borderRadius: 2,
                              background: colors[i % colors.length]
                            }} />
                            <div style={{ flex: 1, fontSize: 13 }}>
                              <div style={{ fontWeight: 500 }}>{source}</div>
                              <div style={{ fontSize: 11, color: '#6b7280' }}>
                                {count} articles ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="panels" style={{ marginTop: 16 }}>
        {/* Recent Anomalies */}
        <div className="panel">
          <div className="panel-header">
            Recent Anomalies
            {anomalies.length > 0 && (
              <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 13 }}>
                ({anomalies.length})
              </span>
            )}
          </div>
          <div className="panel-body" style={{ padding: 14, overflow: 'auto', maxHeight: 300 }}>
            {anomalies.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No anomalies detected</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {anomalies.map((anomaly, i) => {
                  if (!anomaly) return null;
                  return (
                    <div
                      key={anomaly.id || i}
                      style={{
                        padding: 12,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#dc2626' }}>
                            {anomaly.anomaly_type ? anomaly.anomaly_type.replace(/_/g, ' ').toUpperCase() : 'ANOMALY'}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                            Severity: {Number(anomaly.severity_score || 0).toFixed(1)}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          {anomaly.detected_at ? new Date(anomaly.detected_at).toLocaleString() : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151' }}>
                        {anomaly.explanation || 'Anomaly detected'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="panel">
          <div className="panel-header">Sentiment Distribution</div>
          <div className="panel-body" style={{ padding: 14 }}>
            {(() => {
              // Calculate sentiment distribution from articles (more accurate)
              // Ensure each article is only counted once - prioritize label over score
              const articlesWithSentiment = articles.filter(a => 
                a && (a.sentiment_label || (a.sentiment_score !== null && a.sentiment_score !== undefined))
              );
              
              let positiveCount = 0;
              let neutralCount = 0;
              let negativeCount = 0;
              
              articlesWithSentiment.forEach(article => {
                // Prioritize sentiment_label if available, otherwise use score
                if (article.sentiment_label === 'positive') {
                  positiveCount++;
                } else if (article.sentiment_label === 'negative') {
                  negativeCount++;
                } else if (article.sentiment_label === 'neutral') {
                  neutralCount++;
                } else if (article.sentiment_score !== null && article.sentiment_score !== undefined) {
                  // Fallback to score-based classification
                  if (article.sentiment_score > 0.1) {
                    positiveCount++;
                  } else if (article.sentiment_score < -0.1) {
                    negativeCount++;
                  } else {
                    neutralCount++;
                  }
                }
              });
              
              const total = positiveCount + neutralCount + negativeCount;
              
              if (total === 0) {
                return <div style={{ color: '#6b7280' }}>No sentiment data available</div>;
              }
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Positive', count: positiveCount, color: '#10b981' },
                    { label: 'Neutral', count: neutralCount, color: '#6b7280' },
                    { label: 'Negative', count: negativeCount, color: '#ef4444' }
                  ].map((sentiment, i) => {
                    const percentage = total > 0 ? Math.round((sentiment.count / total) * 100) : 0;
                    
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 500 }}>{sentiment.label}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {sentiment.count} ({percentage}%)
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
                            backgroundColor: sentiment.color,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Recent News Articles */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          Recent News Articles
          {articles.length > 0 && (
            <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 13 }}>
              ({articles.length})
            </span>
          )}
        </div>
        <div className="panel-body" style={{ overflow: 'auto', padding: 14, maxHeight: 400 }}>
          {articles.length === 0 ? (
            <div style={{ color: '#6b7280' }}>
              {loading ? 'Loading articles...' : 'No articles found. Try adjusting the time range or wait for news ingestion.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
                {articles.map((article, i) => {
                  if (!article) return null;
                  return (
                    <div
                      key={article.id || i}
                      style={{
                        border: '1px solid #eef2f7',
                        borderRadius: 10,
                        padding: 12,
                        background: article.is_anomaly ? '#fef2f2' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>
                            {article.title || 'Untitled Article'}
                          </div>
                          {article.description && (
                            <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 8, lineHeight: 1.5 }}>
                              {article.description}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                          {article.is_anomaly && (
                            <div style={{
                              padding: '4px 8px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              ANOMALY
                            </div>
                          )}
                          {article.sentiment_label && (
                            <div style={{
                              padding: '4px 8px',
                              background: article.sentiment_label === 'positive' ? '#d1fae5' : 
                                         article.sentiment_label === 'negative' ? '#fee2e2' : 
                                         '#f3f4f6',
                              color: article.sentiment_label === 'positive' ? '#065f46' : 
                                     article.sentiment_label === 'negative' ? '#991b1b' : 
                                     '#374151',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              {article.sentiment_label}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6b7280' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontWeight: 500 }}>{article.source || 'Unknown'}</span>
                          {article.author && <span>by {article.author}</span>}
                        </div>
                        <div>
                          {article.published_at && (
                            <span>{new Date(article.published_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      {article.url && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}
                          >
                            Read more →
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

