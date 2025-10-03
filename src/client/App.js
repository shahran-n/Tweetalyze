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

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const onSearch = (q) => {
    const query = q.trim();
    if (!query) return;
    setSearchQuery(query);
    setSearchLoading(true);
    setSearchError('');
    setSearchData(null);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(typeof json === 'string' ? json : (json.error && (json.error.message || json.error.title)) || 'Request failed');
        return json;
      })
      .then((json) => setSearchData(json))
      .catch((e) => setSearchError(e.message || 'Request failed'))
      .finally(() => setSearchLoading(false));
  };

  return (
    <div className="app-shell">
      <Sidebar currentRoute={route} />
      <div className="app-main">
        <Header onSearch={onSearch} />
        <div className="app-content">
          {routes({ searchQuery, searchData, searchLoading, searchError })[route] || <PlaceholderPage title="Not Found" />}
        </div>
      </div>
    </div>
  );
}
