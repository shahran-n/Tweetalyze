import React from 'react';

export default function Header({ onSearch, searchLoading }) {
  const [value, setValue] = React.useState('');

  const triggerSearch = () => {
    const q = value.trim();
    if (!q || searchLoading) return;
    
    // if the user typed only a handle (with or without @), default to user analytics
    const handleOnly = q.replace(/^@/, '');
    if (/^[A-Za-z0-9_]{1,15}$/.test(handleOnly)) {
      onSearch && onSearch({ type: 'user', value: handleOnly });
    } else {
      onSearch && onSearch({ type: 'query', value: q });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !searchLoading) {
      triggerSearch();
    }
  };

  return (
    <header className="header">
      <div className="header-title">Dashboard</div>
      <div className="header-actions">
        <input 
          className="search-input" 
          placeholder="Enter a Twitter handle..." 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          onKeyDown={onKeyDown}
          disabled={searchLoading}
        />
        <button 
          className="primary-btn" 
          onClick={triggerSearch}
          disabled={searchLoading}
          style={{ opacity: searchLoading ? 0.6 : 1, cursor: searchLoading ? 'not-allowed' : 'pointer' }}
        >
          {searchLoading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>
    </header>
  );
}