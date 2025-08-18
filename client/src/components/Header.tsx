import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#1e1e1e' }}>
      <Toolbar>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" component="div" sx={{ cursor: 'pointer' }}>
            AniMatch
          </Typography>
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
