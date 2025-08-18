import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { CssBaseline, GlobalStyles } from '@mui/material';
import Home from './pages/Home';
import Result from './pages/Result';
import Header from './components/Header';
import Footer from './components/Footer';

const ScrollPage: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div
    style={{
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch', // smooth on iOS
      overscrollBehavior: 'contain',    // prevent scroll chaining
    }}
  >
    {children}
  </div>
);

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
      {/* This keeps the app frame fixed-height, no page-level scroll */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Only Result gets its own scrollable viewport */}
          <Route
            path="/result"
            element={
              <ScrollPage>
                <Result />
              </ScrollPage>
            }
          />
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
