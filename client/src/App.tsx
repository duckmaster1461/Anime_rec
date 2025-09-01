// src/App.tsx
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { CssBaseline, GlobalStyles } from '@mui/material';
import Home from './pages/Home';
import Result from './pages/Result';
import ResultDetail from './pages/ResultDetail';
import Header from './components/Header';
import Footer from './components/Footer';

const Layout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Toggle page scroll only on Home
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (isHome) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
    }
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
    };
  }, [isHome]);

  return (
    <div
      style={{
        minHeight: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isHome
          ? 'linear-gradient(to bottom right, #ff7f50 0%, #ff7f50 50%, #ffec99 50%, #ffec99 75%, #b3d9ff 75%)'
          : '#ffffff',
      }}
    >
      <Header />
      <div
        style={{
          flex: 1,
          // Home: no scrolling; Others: enable vertical scroll
          overflow: isHome ? 'hidden' : 'auto',
        }}
      >
        <Outlet />
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
          html: { height: '100%' },           // no global overflow hidden
          body: { height: '100%', margin: 0 },// no global overflow hidden
          '#root': { height: '100%' },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="results" element={<Result />} />
          <Route path="results/:id" element={<ResultDetail />} />

          {/* optional legacy redirect */}
          <Route path="result" element={<Navigate to="/results" replace />} />

          {/* optional 404 fallback */}
          {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
