import React from 'react';
import './app.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';

const routes = {
  '#/dashboard': <Dashboard />,
  '#/play-tweetle': <PlaceholderPage title="Play Tweetle" />,
  '#/search': <PlaceholderPage title="Search" />,
  '#/chart-builder': <PlaceholderPage title="Chart Builder" />,
  '#/newsboard': <PlaceholderPage title="Newsboard" />,
  '#/quick-trend': <PlaceholderPage title="Quick Trend" />,
  '#/sentiment-analysis': <PlaceholderPage title="Sentiment Analysis" />,
  '#/bot-training': <PlaceholderPage title="Bot Training" />,
  '#/tweet-generator': <PlaceholderPage title="Tweet Generator" />
};

export default function App() {
  const [route, setRoute] = React.useState(window.location.hash || '#/dashboard');

  React.useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar currentRoute={route} />
      <div className="app-main">
        <Header />
        <div className="app-content">
          {routes[route] || <PlaceholderPage title="Not Found" />}
        </div>
      </div>
    </div>
  );
}
