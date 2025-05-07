import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [animeOptions, setAnimeOptions] = useState<{ label: string }[]>([]);
  const [selectedAnime1, setSelectedAnime1] = useState<{ label: string } | null>(null);
  const [selectedAnime2, setSelectedAnime2] = useState<{ label: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/anime/titles');
        setAnimeOptions(res.data);
      } catch (err) {
        console.error('Failed to load anime titles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTitles();
  }, []);

  // Filter options based on what's selected in the opposite field
  const filteredOptions1 = animeOptions.filter(
    (opt) => !selectedAnime2 || opt.label !== selectedAnime2.label
  );
  const filteredOptions2 = animeOptions.filter(
    (opt) => !selectedAnime1 || opt.label !== selectedAnime1.label
  );

  return (
    <Box
      sx={{
        height: 'calc(100vh - 128px)',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
      }}
    >
      {/* Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          zIndex: -1,
          background: `linear-gradient(to bottom right, #ff7f50 0%, #ff7f50 50%, #ffec99 50%, #ffec99 75%, #b3d9ff 75%)`,
          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
        }}
      />

      <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2, color: '#222' }}>
        AniMatch
      </Typography>

      <Typography variant="h6" sx={{ mb: 4, color: '#444', fontWeight: 600 }}>
        Find animes that match your liking!
      </Typography>

      <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }} mb={4}>
        <Autocomplete
          options={filteredOptions1}
          value={selectedAnime1}
          onChange={(_, value) => setSelectedAnime1(value)}
          getOptionLabel={(option) => option.label}
          loading={loading}
          sx={{ width: { xs: '100%', md: '300px' }, bgcolor: 'white' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="What is an anime you like?"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          options={filteredOptions2}
          value={selectedAnime2}
          onChange={(_, value) => setSelectedAnime2(value)}
          getOptionLabel={(option) => option.label}
          loading={loading}
          sx={{ width: { xs: '100%', md: '300px' }, bgcolor: 'white' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="What is another anime you like?"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>

      <Button
        variant="contained"
        onClick={() => navigate('/result')}
        sx={{
          px: 6,
          py: 1.5,
          borderRadius: '30px',
          backgroundColor: '#2196f3',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
          '&:hover': {
            backgroundColor: '#1976d2',
          },
        }}
      >
        Search
      </Button>
    </Box>
  );
};

export default Home;
