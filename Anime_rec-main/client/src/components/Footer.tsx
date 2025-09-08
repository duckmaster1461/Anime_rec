import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#222',
        color: '#fff',
        py: 2,
        mt: 'auto',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2">© 2025 AniMatch. All rights reserved.</Typography>
    </Box>
  );
};

export default Footer;
