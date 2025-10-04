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
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const closeMenu = () => setIsOpen(false);

  // Close menu when route changes
  React.useEffect(() => {
    closeMenu();
  }, [currentRoute]);

  // Close menu when clicking outside on mobile
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) {
        closeMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Hamburger button - only visible on mobile */}
      <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle menu">
        <span className={isOpen ? 'active' : ''}></span>
        <span className={isOpen ? 'active' : ''}></span>
        <span className={isOpen ? 'active' : ''}></span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" />
          <div className="sidebar-title">TWEETALYZE</div>
        </div>
        <nav className="nav">
          {links.map(link => (
            <a 
              key={link.href} 
              href={link.href} 
              className={`nav-link ${currentRoute === link.href ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}