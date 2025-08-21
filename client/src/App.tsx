import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  useParams,
} from 'react-router-dom';
import { CssBaseline, GlobalStyles } from '@mui/material';
import Home from './pages/Home';
import Result from './pages/Result';
import ResultDetail from './pages/ResultDetail';
import Header from './components/Header';
import Footer from './components/Footer';

// ✅ small helper to redirect legacy /result/:slug -> /results/:slug
function LegacyResultRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/results/${slug}` : '/results'} replace />;
}

const Layout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isHome
          ? 'linear-gradient(to bottom right, #ff7f50 0%, #ff7f50 50%, #ffec99 50%, #ffec99 75%, #b3d9ff 75%)'
          : '#ffffff',
      }}
    >
      <Header />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Canonical results routes */}
          <Route path="/results" element={<Result />} />
          <Route path="/results/:slug" element={<ResultDetail />} />

          {/* Legacy /result redirects */}
          <Route path="/result" element={<Navigate to="/results" replace />} />
          <Route path="/result/:slug" element={<LegacyResultRedirect />} />

          {/* 404 fallback (optional) */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: { height: '100%', overflow: 'hidden' },
          body: { height: '100%', margin: 0, overflow: 'hidden' },
          '#root': { height: '100%' },
        }}
      />
      <Layout />
    </Router>
  );
};

export default App;
