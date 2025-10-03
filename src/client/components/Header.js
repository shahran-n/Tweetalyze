import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-title">Dashboard</div>
      <div className="header-actions">
        <input className="search-input" placeholder="Enter a Twitter handle..." />
        <button className="icon-btn" title="Refresh">⟳</button>
        <button className="icon-btn" title="Undo">↶</button>
        <button className="primary-btn">Generate Report</button>
      </div>
    </header>
  );
}


