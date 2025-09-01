// src/pages/Home.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, Autocomplete, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { fetchTitles } from '../api';

interface AnimeOption { label: string }

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [options1, setOptions1] = useState<AnimeOption[]>([]);
  const [options2, setOptions2] = useState<AnimeOption[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [selectedAnime1, setSelectedAnime1] = useState<AnimeOption | string | null>(null);
  const [selectedAnime2, setSelectedAnime2] = useState<AnimeOption | string | null>(null);

  const runFetch = async (
    query: string,
    setter: React.Dispatch<React.SetStateAction<AnimeOption[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!query || query.trim().length < 2) {
      setter([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchTitles(query.trim(), 10);
      // de-dupe by lower-cased label
      const seen = new Set<string>();
      const list: AnimeOption[] = [];
      for (const r of res) {
        const label = (r?.label ?? '').trim();
        if (!label) continue;
        const key = label.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ label });
        }
      }
      setter(list);
    } catch (e) {
      console.error('Error fetching titles:', e);
      setter([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch1 = useMemo(
    () => debounce((q: string) => runFetch(q, setOptions1, setLoading1), 300),
    []
  );
  const debouncedFetch2 = useMemo(
    () => debounce((q: string) => runFetch(q, setOptions2, setLoading2), 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedFetch1.cancel();
      debouncedFetch2.cancel();
    };
  }, [debouncedFetch1, debouncedFetch2]);

  const normalize = (v: AnimeOption | string | null) =>
    typeof v === 'string' ? v.trim() : v?.label.trim();

  const handleClick = () => {
    const label1 = normalize(selectedAnime1);
    const label2 = normalize(selectedAnime2);

    if (!label1 || !label2) {
      alert('Please select two anime titles.');
      return;
    }
    if (label1.toLowerCase() === label2.toLowerCase()) {
      alert('Please select two different anime titles.');
      return;
    }

    navigate('/results', { state: { anime1: label1, anime2: label2 } });
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
               justifyContent: 'center', alignItems: 'center', px: 3, overflow: 'hidden' }}>
      <Box sx={{
        position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: -1,
        background: `linear-gradient(to bottom right, #ff7f50 0%, #ff7f50 50%, #ffec99 50%, #ffec99 75%, #b3d9ff 75%)`,
      }} />

      <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1, color: '#222' }}>
        AniMatch
      </Typography>
      <Typography variant="h6" sx={{ mb: 3, color: '#444', fontWeight: 600 }}>
        Find animes that match your liking!
      </Typography>

      <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }} mb={3}>
        <Autocomplete
          freeSolo
          options={options1.filter(opt => {
            const other = normalize(selectedAnime2);
            return other ? opt.label.toLowerCase() !== other.toLowerCase() : true;
          })}
          loading={loading1}
          onInputChange={(_, value) => debouncedFetch1(value)}
          value={selectedAnime1}
          onChange={(_, value) => setSelectedAnime1(value)}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
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
                    {loading1 ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          freeSolo
          options={options2.filter(opt => {
            const other = normalize(selectedAnime1);
            return other ? opt.label.toLowerCase() !== other.toLowerCase() : true;
          })}
          loading={loading2}
          onInputChange={(_, value) => debouncedFetch2(value)}
          value={selectedAnime2}
          onChange={(_, value) => setSelectedAnime2(value)}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
          sx={{ width: { xs: '100%', md: '300px' }, bgcolor: 'white' }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="What is another anime you like?"
              variant="outlined"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleClick();
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading2 ? <CircularProgress color="inherit" size={20} /> : null}
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
        onClick={handleClick}
        sx={{
          px: 6, py: 1.5, borderRadius: '30px', backgroundColor: '#2196f3',
          fontSize: '16px', fontWeight: 'bold', boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
          '&:hover': { backgroundColor: '#1976d2' },
        }}
      >
        Search
      </Button>
    </Box>
  );
};

export default Home;
