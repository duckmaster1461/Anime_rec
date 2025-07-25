import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Box, Typography, TextField, Autocomplete, Button, Pagination,
  Slider, RadioGroup, Radio, FormControlLabel, FormLabel, Select, MenuItem
} from '@mui/material';

interface Anime {
  Name: string;
  Synopsis: string;
  Score: number;
  Aired: string;
  "Image URL": string;
}

const PAGE_SIZE = 50;

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
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

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

const fetchResults = async (pageOverride = page) => {
  try {
    const res = await axios.get('http://localhost:5000/api/anime', {
      params: {
        page: pageOverride,
        limit: PAGE_SIZE,
        sort: sortMap[sortField] || 'score',
      }
    });
    setAnimeList(res.data.results);
    setTotalCount(res.data.total || 0);
  } catch (err) {
    console.error('❌ Failed to fetch anime list', err);
  }
};


  const handleResetFilters = () => {
    setBeforeYear('');
    setAfterYear('');
    setSeason('');
    setRating([0, 10]);
    setSortField('Score');
    setPage(1);
    fetchResults(1);
  };

  useEffect(() => {
    fetchResults();
  }, [page, sortField]);

  return (
    <Box display="flex" height="calc(100vh - 128px)">
      {/* Sidebar Filters */}
      <Box
        width="300px"
        p={3}
        bgcolor="#f9f9f9"
        borderRight="1px solid #ddd"
        display="flex"
        flexDirection="column"
        gap={4}
      >
        <Box>
          <Typography variant="h6" gutterBottom>Release Year</Typography>
          <TextField label="Before" fullWidth margin="dense" value={beforeYear} onChange={(e) => setBeforeYear(e.target.value)} />
          <TextField label="After" fullWidth margin="dense" value={afterYear} onChange={(e) => setAfterYear(e.target.value)} />
        </Box>

        <Box>
          <FormLabel component="legend">Season</FormLabel>
          <RadioGroup row value={season} onChange={(e) => setSeason(e.target.value)}>
            {['Spring', 'Summer', 'Autumn', 'Winter'].map((s) => (
              <FormControlLabel key={s} value={s} control={<Radio />} label={s} />
            ))}
          </RadioGroup>
        </Box>

        <Box>
          <Typography gutterBottom>Rating</Typography>
          <Slider value={rating} onChange={(_, val) => setRating(val as number[])} valueLabelDisplay="auto" min={0} max={10} />
        </Box>

        <Box>
          <Typography gutterBottom>Sort by</Typography>
          <Select value={sortField} onChange={(e) => setSortField(e.target.value)} fullWidth>
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

        <Button variant="outlined" onClick={handleResetFilters}>Reset Filters</Button>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} p={0} display="flex" flexDirection="column" height="100%">
        {/* Sticky Search Bar */}
        <Box
          position="sticky"
          top={0}
          zIndex={10}
          bgcolor="white"
          p={3}
          borderBottom="1px solid #ddd"
          display="flex"
          gap={2}
        >
          <Autocomplete
            freeSolo
            options={options1.filter(opt => opt.label !== anime2)}
            value={anime1}
            onChange={(_, val) => setAnime1(typeof val === 'string' ? val : val?.label || '')}
            onInputChange={(_, val) => {
              setAnime1(val);
              debouncedFetch1(val);
            }}
            loading={loading1}
            renderInput={(params) => (
              <TextField {...params} label="Anime 1" InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading1 ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }} />
            )}
            sx={{ width: 300 }}
          />

          <Autocomplete
            freeSolo
            options={options2.filter(opt => opt.label !== anime1)}
            value={anime2}
            onChange={(_, val) => setAnime2(typeof val === 'string' ? val : val?.label || '')}
            onInputChange={(_, val) => {
              setAnime2(val);
              debouncedFetch2(val);
            }}
            loading={loading2}
            renderInput={(params) => (
              <TextField {...params} label="Anime 2" InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading2 ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }} />
            )}
            sx={{ width: 300 }}
          />
          {/* TODO */}
          <Button
  variant="contained"
  color="primary"  
>
  Search
</Button>

        </Box>

        {/* Anime List */}
        <Box flexGrow={1} overflow="auto" p={4}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Found {animeList?.length || 0} result{animeList?.length !== 1 ? 's' : ''}!
          </Typography>

          <Box display="flex" flexDirection="column" gap={3}>
            {animeList.map((anime, idx) => (
              <Box
                key={idx}
                p={3}
                border="1px solid #ccc"
                borderRadius="20px"
                bgcolor="white"
                display="flex"
                gap={3}
                alignItems="flex-start"
              >
                <Box flexShrink={0}>
                  <img
                    src={anime["Image URL"]}
                    alt={anime.Name}
                    style={{
                      width: '120px',
                      height: '170px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '1px solid #ddd'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/fallback-image.jpg';
                    }}
                  />
                </Box>
                <Box flexGrow={1}>
                  <Typography variant="h6">{anime.Name}</Typography>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {anime.Synopsis?.slice(0, 200)}...
                  </Typography>
                  <Box display="flex" justifyContent="space-between" textAlign="center">
                    <Box>
                      <Typography variant="body1" fontWeight="bold">Rating</Typography>
                      <Typography>{anime.Score}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">Aired</Typography>
                      <Typography>{anime.Aired}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <Box mt={4} display="flex" justifyContent="center">
              <Pagination
                count={Math.ceil(totalCount / PAGE_SIZE)}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Result;
