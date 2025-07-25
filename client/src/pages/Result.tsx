import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Box, Typography, TextField, Autocomplete, Button,
  Slider, Select, MenuItem
} from '@mui/material';

interface Anime {
  Name: string;
  Synopsis: string;
  Score: number;
  Aired: string;
  "Image URL": string;
}

//const PAGE_SIZE = 50; // used for API limit

const sortMap: Record<string, string> = {
  Score: 'score',
  Aired: 'aired',
  Popularity: 'popularity',
  Episodes: 'episodes',
  Duration: 'duration',
  Favorites: 'favorites',
  Ranked: 'ranked',
  Members: 'members'
};

const Result: React.FC = () => {
  const location = useLocation();
  const defaultAnime1 = (location.state as any)?.anime1 || '';
  const defaultAnime2 = (location.state as any)?.anime2 || '';

  const [anime1, setAnime1] = useState<string | null>(defaultAnime1);
  const [anime2, setAnime2] = useState<string | null>(defaultAnime2);
  const [options1, setOptions1] = useState<{ label: string }[]>([]);
  const [options2, setOptions2] = useState<{ label: string }[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [beforeYear, setBeforeYear] = useState('');
  const [afterYear, setAfterYear] = useState('');
  const [season, setSeason] = useState('');
  const [rating, setRating] = useState<number[]>([0, 10]);
  const [sortField, setSortField] = useState('Score');
  const [animeList, setAnimeList] = useState<Anime[]>([]);

  const fetchTitles = async (query: string, setter: any, setLoading: any) => {
    if (!query) return setter([]);
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/anime/titles', {
        params: { q: query, limit: 10 },
      });
      setter(res.data);
    } catch (err) {
      console.error('Failed to fetch titles', err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch1 = useMemo(() => debounce((q: string) => fetchTitles(q, setOptions1, setLoading1), 300), []);
  const debouncedFetch2 = useMemo(() => debounce((q: string) => fetchTitles(q, setOptions2, setLoading2), 300), []);


  const fetchResults = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/anime', {
        params: {
          anime1,
          anime2,
          beforeYear,
          afterYear,
          season,
          minRating: rating[0],
          maxRating: rating[1],
          sort: sortMap[sortField] || 'score',
          order: 'desc',
          limit: 50,
        },
      });
      setAnimeList(res.data.results);
    } catch (err) {
      console.error('❌ Failed to fetch anime list', err);
    }
  }, [anime1, anime2, beforeYear, afterYear, season, rating, sortField]);


  const handleResetFilters = () => {
    setBeforeYear('');
    setAfterYear('');
    setSeason('');
    setRating([0, 10]);
    setSortField('Score');
    fetchResults();
  };

  // Fetch on mount and when sort changes
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);


  return (
    <Box
      display="flex"
      height="calc(100vh - 128px)"
      sx={{
        background: 'linear-gradient(to top left, rgb(180, 63, 47) 0%, rgb(114, 80, 173) 50%, rgb(84, 151, 193) 100%)'
      }}
    >
      {/* Sidebar Filters */}
      <Box
        width="300px"
        p={3}
        bgcolor="transparent"
        borderRight="0px solid #ddd"
        display="flex"
        flexDirection="column"
        gap={4}
        sx={{
          backdropFilter: 'blur(2px)',
          color: '#fff',
          textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          fontWeight: 500
        }}
      >
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>Release Year</Typography>
          <TextField
            label="Before"
            fullWidth
            margin="dense"
            value={beforeYear}
            onChange={(e) => setBeforeYear(e.target.value)}
            InputLabelProps={{ style: { color: '#fff' } }}
            InputProps={{ style: { color: '#fff' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#fff' },
          '&:hover fieldset': { borderColor: '#fff' },
          '&.Mui-focused fieldset': { borderColor: '#fff' },
              },
              '& .MuiInputLabel-root': { color: '#fff' }
            }}
          />
          <TextField
            label="After"
            fullWidth
            margin="dense"
            value={afterYear}
            onChange={(e) => setAfterYear(e.target.value)}
            InputLabelProps={{ style: { color: '#fff' } }}
            InputProps={{ style: { color: '#fff' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#fff' },
          '&:hover fieldset': { borderColor: '#fff' },
          '&.Mui-focused fieldset': { borderColor: '#fff' },
              },
              '& .MuiInputLabel-root': { color: '#fff' }
            }}
          />
        </Box>

        <Box>
          <Typography variant='h6' gutterBottom sx={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>Rating</Typography>
          <Slider
            value={rating}
            onChange={(_, val) => setRating(val as number[])}
            valueLabelDisplay="auto"
            min={0.0}
            max={10.0}
            sx={{ color: 'rgb(0, 26, 255)' }}
          />
        </Box>

        <Box>
          <Typography variant='h6' gutterBottom sx={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>Sort by</Typography>
          <Select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            fullWidth
            sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#fff' }, '.MuiSvgIcon-root': { color: '#fff' } }}
          >
            <MenuItem value="Score">Rating</MenuItem>
            <MenuItem value="Aired">Release Year</MenuItem>
            <MenuItem value="Popularity">Popularity</MenuItem>
            <MenuItem value="Episodes">Episodes</MenuItem>
            <MenuItem value="Duration">Duration</MenuItem>
            <MenuItem value="Favorites">Favorites</MenuItem>
            <MenuItem value="Ranked">Rank</MenuItem>
            <MenuItem value="Members">Members</MenuItem>
          </Select>
        </Box>

        <Button variant="outlined" onClick={handleResetFilters} sx={{ color: '#fff', borderColor: '#fff' }}>
          Reset Filters
        </Button>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} display="flex" flexDirection="column" height="100%">
        {/* Sticky Search Bar */}
        <Box
          position="sticky"
          top={0}
          zIndex={10}
          bgcolor="transparent"
          p={3}
          display="flex"
          gap={2}
          sx={{ backdropFilter: 'blur(2px)', color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
        >
          <Autocomplete
            freeSolo
            options={options1.filter(opt => opt.label !== anime2)}
            value={anime1}
            onChange={(_, val) => setAnime1(typeof val === 'string' ? val : val?.label || '')}
            onInputChange={(_, val) => { setAnime1(val); debouncedFetch1(val); }}
            loading={loading1}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Anime 1"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <> {loading1 ? <CircularProgress size={20}/> : null} {params.InputProps.endAdornment} </>
                  ),
                  style: { color: '#fff' }
                }}
                InputLabelProps={{ style: { color: '#fff' } }}
                sx={{ width: 300 }}
              />
            )}
          />

          <Autocomplete
            freeSolo
            options={options2.filter(opt => opt.label !== anime1)}
            value={anime2}
            onChange={(_, val) => setAnime2(typeof val === 'string' ? val : val?.label || '')}
            onInputChange={(_, val) => { setAnime2(val); debouncedFetch2(val); }}
            loading={loading2}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Anime 2"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <> {loading2 ? <CircularProgress size={20}/> : null} {params.InputProps.endAdornment} </>
                  ),
                  style: { color: '#fff' }
                }}
                InputLabelProps={{ style: { color: '#fff' } }}
                sx={{ width: 300 }}
              />
            )}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={fetchResults}
            sx={{ fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            Search
          </Button>
        </Box>

        {/* Anime List */}
        <Box
          flexGrow={1}
          overflow="auto"
          p={4}
          sx={{
            '&::-webkit-scrollbar': { width: '16px', background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.08)', borderRadius: '16px' },
            scrollbarColor: 'rgba(255,255,255,0.08) transparent', scrollbarWidth: 'thin'
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={2} sx={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            Found {animeList?.length || 0} result{animeList?.length !== 1 ? 's' : ''}!
          </Typography>

          <Box display="flex" flexDirection="column" gap={3}>
            {animeList.map((anime, idx) => (
              <Box key={idx} p={3} border="2px solid #ccc" borderRadius="20px" bgcolor="transparent" display="flex" gap={3} alignItems="flex-start" sx={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(2px)' }}>
                <Box flexShrink={0}>
                  <img src={anime["Image URL"]} alt={anime.Name} style={{ width: '120px', height: '170px', objectFit: 'cover', borderRadius: '10px' }} onError={(e) => { (e.target as HTMLImageElement).src = '/fallback-image.jpg'; }} />
                </Box>
                <Box flexGrow={1}>
                  <Typography variant="h6">{anime.Name}</Typography>
                  <Typography variant="body2" color="textSecondary" mb={2}>{anime.Synopsis?.slice(0, 200)}...</Typography>
                  <Box display="flex" justifyContent="space-between" textAlign="center">
                    <Box><Typography variant="body1" fontWeight="bold">Rating</Typography><Typography>{anime.Score}</Typography></Box>
                    <Box><Typography variant="body1" fontWeight="bold">Aired</Typography><Typography>{anime.Aired}</Typography></Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Result;
