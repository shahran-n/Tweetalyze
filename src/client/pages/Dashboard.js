import React from 'react';

const Metric = ({ title, color }) => (
  <div className={`metric-card ${color}`}>
    <div>
      <div className="metric-title">{title}</div>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div>
      <div className="cards-grid">
        <Metric title="Sample Size" color="blue" />
        <Metric title="Followers" color="purple" />
        <Metric title="Following" color="yellow" />
        <Metric title="Frequency (Tweets/Day)" color="teal" />
        <Metric title="Length (Characters)" color="blue" />
        <Metric title="Sample Unique Words" color="yellow" />
        <Metric title="Retweets" color="green" />
        <Metric title="Likes" color="red" />
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
    </div>
  );
}


