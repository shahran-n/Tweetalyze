import React from 'react';

export default function Header() {
  const [value, setValue] = React.useState('');

  const triggerSearch = () => {
    const q = value.trim();
    if (!q) return;
    window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  return (
    <header className="header">
      <div className="header-title">Dashboard</div>
      <div className="header-actions">
        <input className="search-input" placeholder="Enter a Twitter handle..." value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={onKeyDown} />
        <button className="primary-btn" onClick={triggerSearch}>Generate Report</button>
      </div>
    </header>
  );
}


