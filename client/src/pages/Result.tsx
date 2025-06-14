import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Box, Typography, TextField, Autocomplete, Button, Slider,
  Radio, RadioGroup, FormControlLabel, FormLabel, Select, MenuItem, Pagination
} from '@mui/material';

interface Anime {
  title: string;
  synopsis: string;
  score: number;
  aired: string;
}

const PAGE_SIZE = 25;

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
  const [sortField, setSortField] = useState('score');
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

  const fetchResults = async (pageOverride = page) => {
    try {
      const res = await axios.get('http://localhost:5000/api/anime', {
        params: {
          anime1,
          anime2,
          sort: sortField,
          order: 'desc',
          beforeYear,
          afterYear,
          season,
          minRating: rating[0],
          maxRating: rating[1],
          page: pageOverride,
          limit: PAGE_SIZE,
        }
      });
      setAnimeList(res.data.results);
      setTotalCount(res.data.total || 0); // Backend must return total count
    } catch (err) {
      console.error('Failed to fetch anime list', err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page]); // fetch on page change

  const handleSearch = () => {
    setPage(1);
    fetchResults(1);
  };

  return (
    <Box display="flex" height="calc(100vh - 128px)">
      {/* Sidebar */}
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
            <MenuItem value="score">Rating</MenuItem>
            <MenuItem value="aired">Release Year</MenuItem>
            <MenuItem value="popularity">Popularity</MenuItem>
          </Select>
        </Box>

        <Button variant="contained" onClick={handleSearch}>Search</Button>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} p={4} overflow="auto">
        <Box display="flex" gap={2} mb={4}>
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

          <Button variant="contained" onClick={handleSearch} sx={{ borderRadius: 5, px: 4 }}>
            Search
          </Button>
        </Box>

        <Typography variant="h5" fontWeight="bold" mb={2}>
          Found {animeList?.length || 0} result{animeList?.length !== 1 ? 's' : ''}!
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          {animeList.length === 0 ? (
            <Box p={3} border="1px dashed #999" borderRadius="20px" bgcolor="#fdfdfd" textAlign="center">
              <Typography variant="h6" color="textSecondary">
                No anime found for this filter. Try adjusting your search.
              </Typography>
            </Box>
          ) : (
            animeList.map((anime, idx) => (
              <Box key={idx} p={3} border="1px solid #ccc" borderRadius="20px" bgcolor="white" display="flex" flexDirection="column">
                <Typography variant="h6">{anime.title}</Typography>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  {anime.synopsis?.slice(0, 200)}...
                </Typography>
                <Box display="flex" justifyContent="space-between" textAlign="center">
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Rating</Typography>
                    <Typography>{anime.score}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">Aired</Typography>
                    <Typography>{anime.aired}</Typography>
                  </Box>
                </Box>
              </Box>
            ))
          )}
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
  );
};

export default Result;
