import React from 'react';
import './app.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';

const routes = (props) => ({
  '#/dashboard': <Dashboard {...props} />,
  '#/play-tweetle': <PlaceholderPage title="Play Tweetle" />,
  '#/chart-builder': <PlaceholderPage title="Chart Builder" />,
  '#/newsboard': <PlaceholderPage title="Newsboard" />,
  '#/quick-trend': <PlaceholderPage title="Quick Trend" />,
  '#/sentiment-analysis': <PlaceholderPage title="Sentiment Analysis" />,
  '#/bot-training': <PlaceholderPage title="Bot Training" />,
  '#/tweet-generator': <PlaceholderPage title="Tweet Generator" />
});

export default function App() {
  const [route, setRoute] = React.useState(window.location.hash || '#/dashboard');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchData, setSearchData] = React.useState(null);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [userProfile, setUserProfile] = React.useState(null);
  
  // Track ongoing requests to prevent duplicates
  const ongoingRequestRef = React.useRef(null);

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const onSearch = (input) => {
    if (!input) return;
    
    // Prevent duplicate requests
    if (searchLoading) {
      console.log('Search already in progress, ignoring duplicate request');
      return;
    }
    
    setSearchError('');
    setUserProfile(null);
    setSearchData(null);
    
    if (input.type === 'user') {
      const handle = input.value;
      const requestKey = `user:${handle}`;
      
      // Check if this exact request is already ongoing
      if (ongoingRequestRef.current === requestKey) {
        console.log('Duplicate request detected, ignoring');
        return;
      }
      
      ongoingRequestRef.current = requestKey;
      setSearchQuery(`from:${handle}`);
      setSearchLoading(true);
      
      fetch(`/api/user-analytics?handle=${encodeURIComponent(handle)}`)
        .then(async (r) => {
          const json = await r.json();
          if (!r.ok) {
            const errorMsg = json && (json.error || json.title) || 'Request failed';
            throw new Error(errorMsg);
          }
          return json;
        })
        .then((json) => { 
          setUserProfile(json.user); 
          setSearchData(json);
          console.log('User analytics loaded successfully');
        })
        .catch((e) => {
          console.error('Search error:', e.message);
          setSearchError(e.message || 'Request failed');
        })
        .finally(() => {
          setSearchLoading(false);
          ongoingRequestRef.current = null;
        });
    } else {
      const query = input.value.trim();
      if (!query) return;
      
      const requestKey = `query:${query}`;
      
      // Check if this exact request is already ongoing
      if (ongoingRequestRef.current === requestKey) {
        console.log('Duplicate request detected, ignoring');
        return;
      }
      
      ongoingRequestRef.current = requestKey;
      setSearchQuery(query);
      setSearchLoading(true);
      
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(async (r) => {
          const json = await r.json();
          if (!r.ok) {
            const errorMsg = typeof json === 'string' ? json : (json.error && (json.error.message || json.error.title)) || 'Request failed';
            throw new Error(errorMsg);
          }
          return json;
        })
        .then((json) => {
          setSearchData(json);
          console.log('Search results loaded successfully');
        })
        .catch((e) => {
          console.error('Search error:', e.message);
          setSearchError(e.message || 'Request failed');
        })
        .finally(() => {
          setSearchLoading(false);
          ongoingRequestRef.current = null;
        });
    }
  };

  return (
    <div className="app-shell">
      <Sidebar currentRoute={route} />
      <div className="app-main">
        <Header onSearch={onSearch} searchLoading={searchLoading} />
        <div className="app-content">
          {routes({ searchQuery, searchData, searchLoading, searchError, userProfile })[route] || <PlaceholderPage title="Not Found" />}
        </div>
      </div>
    </div>
  );
}