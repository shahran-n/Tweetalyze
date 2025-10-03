import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div>
      <h2 style={{ margin: 0, padding: '8px 0 16px 0', color: '#1f2a56' }}>{title}</h2>
      <div style={{ background: '#fff', border: '1px solid #eef2f7', borderRadius: 10, padding: 24 }}>Coming soon...</div>
    </div>
  );
}


