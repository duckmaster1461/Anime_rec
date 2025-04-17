import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#1e1e1e' }}>
      <Toolbar>
        <Typography variant="h6" component="div">
          AniMatch
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
