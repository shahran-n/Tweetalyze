import React from 'react';

export default function Header({ onSearch }) {
  const [value, setValue] = React.useState('');

  const triggerSearch = () => {
    const q = value.trim();
    if (!q) return;
    // if the user typed only a handle (with or without @), default to user analytics
    const handleOnly = q.replace(/^@/, '');
    if (/^[A-Za-z0-9_]{1,15}$/.test(handleOnly)) {
      onSearch && onSearch({ type: 'user', value: handleOnly });
    } else {
      onSearch && onSearch({ type: 'query', value: q });
    }
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


