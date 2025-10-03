import React from 'react';

const links = [
  { href: '#/dashboard', label: 'Dashboard' },
  { href: '#/play-tweetle', label: 'Play Tweetle' },
  { href: '#/search', label: 'Search' },
  { href: '#/chart-builder', label: 'Chart Builder' },
  { href: '#/newsboard', label: 'Newsboard' },
  { href: '#/quick-trend', label: 'Quick Trend' },
  { href: '#/sentiment-analysis', label: 'Sentiment Analysis' },
  { href: '#/bot-training', label: 'Bot Training' },
  { href: '#/tweet-generator', label: 'Tweet Generator' }
];

export default function Sidebar({ currentRoute }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo" />
        <div className="sidebar-title">TWEETALYZE</div>
      </div>
      <nav className="nav">
        {links.map(link => (
          <a key={link.href} href={link.href} className={`nav-link ${currentRoute === link.href ? 'active' : ''}`}>
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}


