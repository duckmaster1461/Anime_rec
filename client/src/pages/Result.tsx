import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// import axios from 'axios'; // ⛔ server (commented)
import debounce from 'lodash.debounce';
import {
  Box, Typography, TextField, Autocomplete, Button, Pagination,
  Slider, RadioGroup, Radio, FormControlLabel, FormLabel, Select, MenuItem,
  CircularProgress, Grid, Card, CardActionArea, CardMedia, CardContent,
  Chip, Stack, Tooltip, Accordion, AccordionSummary, AccordionDetails, Skeleton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { dummyAnimeList } from '../data/dummyAnimeData';

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
  const [season, setSeason] = useState(''); // kept for UI parity
  const [rating, setRating] = useState<number[]>([0, 10]);
  const [sortField, setSortField] = useState('Score');

  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);

  const sortMap: Record<string, string> = {
    Score: 'score',
    Aired: 'aired',
    Popularity: 'popularity',
    Episodes: 'episodes',
    Duration: 'duration',
    Favorites: 'favorites',
    Ranked: 'ranked',
    Members: 'members',
  };

  // ---- SERVER TITLE FETCH (disabled) ----------------------------
  // const fetchTitles = async (query: string, setter: any, setLoading: any) => {
  //   if (!query) return setter([]);
  //   try {
  //     setLoading(true);
  //     const res = await axios.get('http://localhost:5000/api/anime/titles', {
  //       params: { q: query, limit: 10 },
  //     });
  //     setter(res.data);
  //   } catch (err) {
  //     console.error('Failed to fetch titles', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // const debouncedFetch1 = useMemo(() => debounce((q: string) => fetchTitles(q, setOptions1, setLoading1), 300), []);
  // const debouncedFetch2 = useMemo(() => debounce((q: string) => fetchTitles(q, setOptions2, setLoading2), 300), []);
  // useEffect(() => () => { debouncedFetch1.cancel(); debouncedFetch2.cancel(); }, [debouncedFetch1, debouncedFetch2]);

  // ---- OFFLINE TITLE SEARCH -------------------------------------
  const allTitleOptions = useMemo(
    () => dummyAnimeList.map(a => ({ label: a.Name })),
    []
  );
  const localTitleSearch = (q: string, setOptions: any, setLoading: any) => {
    if (!q?.trim()) return setOptions([]);
    setLoading(true);
    const lower = q.toLowerCase();
    const out = allTitleOptions
      .filter(o => o.label.toLowerCase().includes(lower))
      .slice(0, 10);
    setOptions(out);
    setLoading(false);
  };
  const debouncedLocal1 = useMemo(
    () => debounce((q: string) => localTitleSearch(q, setOptions1, setLoading1), 200),
    []
  );
  const debouncedLocal2 = useMemo(
    () => debounce((q: string) => localTitleSearch(q, setOptions2, setLoading2), 200),
    []
  );
  useEffect(() => () => { debouncedLocal1.cancel(); debouncedLocal2.cancel(); }, [debouncedLocal1, debouncedLocal2]);

  // ---- SERVER RESULT FETCH (disabled) ---------------------------
  // const fetchResults = async (pageOverride = page) => {
  //   try {
  //     setLoadingList(true);
  //     const params: any = {
  //       page: pageOverride,
  //       limit: PAGE_SIZE,
  //       sort: sortMap[sortField] || 'score',
  //       order: 'desc',
  //       beforeYear: beforeYear || undefined,
  //       afterYear: afterYear || undefined,
  //       season: season || undefined,
  //       minRating: rating?.[0] ?? undefined,
  //       maxRating: rating?.[1] ?? undefined,
  //       minScore: rating?.[0] ?? undefined,
  //       maxScore: rating?.[1] ?? undefined,
  //       anime1: anime1 || undefined,
  //       anime2: anime2 || undefined,
  //     };
  //     const res = await axios.get('http://localhost:5000/api/anime', { params });
  //     setAnimeList(res.data.results || []);
  //     setTotalCount(res.data.total || 0);
  //   } catch (err) {
  //     console.error('❌ Failed to fetch anime list', err);
  //   } finally {
  //     setLoadingList(false);
  //   }
  // };

  // ---- OFFLINE RESULT PIPELINE ---------------------------------
  // 1) Make computeResults accept overrides
  const computeResults = (
    pageOverride = page,
    overrides?: Partial<{
      anime1: string | null;
      anime2: string | null;
      afterYear: string;
      beforeYear: string;
      rating: number[];
      sortField: string;
    }>
  ) => {
    setLoadingList(true);

    const a1 = (overrides?.anime1 ?? anime1) || '';
    const a2 = (overrides?.anime2 ?? anime2) || '';
    const aftY = overrides?.afterYear ?? afterYear;
    const befY = overrides?.beforeYear ?? beforeYear;
    const rate = overrides?.rating ?? rating;
    const sort = overrides?.sortField ?? sortField;

    let list = [...dummyAnimeList];

    if (a1) list = list.filter(x => x.Name.toLowerCase().includes(a1.toLowerCase()));
    if (a2) list = list.filter(x => x.Name.toLowerCase().includes(a2.toLowerCase()));
    if (aftY)  list = list.filter(x => parseInt(x.Aired || '0', 10) >= parseInt(aftY, 10));
    if (befY)  list = list.filter(x => parseInt(x.Aired || '0', 10) <= parseInt(befY, 10));

    const [minR, maxR] = rate;
    list = list.filter(x => (x.Score ?? 0) >= minR && (x.Score ?? 0) <= maxR);

    const key = (sortMap[sort] || 'score').toLowerCase();
    if (key === 'score') {
      list.sort((a, b) => (b.Score ?? 0) - (a.Score ?? 0));
    } else if (key === 'aired') {
      list.sort((a, b) => parseInt(b.Aired || '0', 10) - parseInt(a.Aired || '0', 10));
    }

    const total = list.length;
    const start = (pageOverride - 1) * PAGE_SIZE;
    const pageSlice = list.slice(start, start + PAGE_SIZE);

    setTotalCount(total);
    setAnimeList(pageSlice);
    setLoadingList(false);
  };

  // initial + on page/sort change
  useEffect(() => {
    // simulate loading
    setLoadingList(true);
    const t = setTimeout(() => computeResults(page), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortField]);

  const handleSearch = () => {
    setPage(1);
    computeResults(1);
  };

  // 2) Fix Reset to clear everything and pass overrides into computeResults
  const handleResetFilters = () => {
    setAnime1('');
    setAnime2('');
    setOptions1([]);
    setOptions2([]);

    setBeforeYear('');
    setAfterYear('');
    setSeason('');
    setRating([0, 10]);
    setSortField('Score');

    setPage(1);
    computeResults(1, {
      anime1: '',
      anime2: '',
      afterYear: '',
      beforeYear: '',
      rating: [0, 10],
      sortField: 'Score',
    });
  };

  // shared filter UI (used in sidebar + accordion)
  const Filters = () => (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>Release Year</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            label="After"
            fullWidth
            size="small"
            value={afterYear}
            onChange={(e) => setAfterYear(e.target.value)}
            placeholder="e.g. 2015"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
          <TextField
            label="Before"
            fullWidth
            size="small"
            value={beforeYear}
            onChange={(e) => setBeforeYear(e.target.value)}
            placeholder="e.g. 2022"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          />
        </Stack>
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
        <Typography variant="subtitle2" gutterBottom>Rating</Typography>
        <Slider value={rating} onChange={(_, v) => setRating(v as number[])} valueLabelDisplay="auto" min={0} max={10} />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>Sort by</Typography>
        <Select value={sortField} onChange={(e) => setSortField(e.target.value as string)} fullWidth size="small">
          <MenuItem value="Score">Rating</MenuItem>
          <MenuItem value="Aired">Release Year</MenuItem>
          {/* Other options kept for future server mode */}
          <MenuItem value="Popularity" disabled>Popularity</MenuItem>
          <MenuItem value="Episodes" disabled>Episodes</MenuItem>
          <MenuItem value="Duration" disabled>Duration</MenuItem>
          <MenuItem value="Favorites" disabled>Favorites</MenuItem>
          <MenuItem value="Ranked" disabled>Rank</MenuItem>
          <MenuItem value="Members" disabled>Members</MenuItem>
        </Select>
      </Box>

      <Stack direction="row" spacing={1}>
        <Button fullWidth variant="contained" onClick={handleSearch}>Apply</Button>
        <Button fullWidth variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetFilters}>Reset</Button>
      </Stack>
    </Box>
  );

  const ActiveChips = () => {
    const chips: { label: string; onDelete: () => void }[] = [];
    if (anime1) chips.push({ label: `Anime 1: ${anime1}`, onDelete: () => setAnime1('') });
    if (anime2) chips.push({ label: `Anime 2: ${anime2}`, onDelete: () => setAnime2('') });
    if (afterYear) chips.push({ label: `After: ${afterYear}`, onDelete: () => setAfterYear('') });
    if (beforeYear) chips.push({ label: `Before: ${beforeYear}`, onDelete: () => setBeforeYear('') });
    if (season) chips.push({ label: `Season: ${season}`, onDelete: () => setSeason('') });
    if (rating[0] !== 0 || rating[1] !== 10) chips.push({ label: `Rating: ${rating[0]}–${rating[1]}`, onDelete: () => setRating([0, 10]) });
    if (!chips.length) return null;
    return (
      <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1, flexWrap: 'wrap', gap: 1 }}>
        {chips.map((c, i) => <Chip key={i} label={c.label} onDelete={c.onDelete} variant="outlined" size="small" />)}
      </Stack>
    );
  };

  return (
    // IMPORTANT: height: '100%' + minHeight: 0 let this page scroll within Layout
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0, bgcolor: 'background.default' }}>
      {/* Sidebar (desktop) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 320,
          p: 3,
          borderRight: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          overflow: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
        <Filters />
      </Box>

      {/* Main */}
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Filters (mobile) */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Filters</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Filters />
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Sticky search row within page scroll (plays nice with Header) */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            bgcolor: 'background.paper',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Autocomplete
            freeSolo
            options={options1.filter((opt) => opt.label !== anime2)}
            value={anime1}
            onChange={(_, val) => setAnime1(typeof val === 'string' ? val : val?.label || '')}
            onInputChange={(_, val) => { setAnime1(val); debouncedLocal1(val); }}
            loading={loading1}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Anime 1"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (<>{loading1 ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>),
                }}
              />
            )}
            sx={{ width: { xs: '100%', sm: 280, md: 320 } }}
          />

          <Autocomplete
            freeSolo
            options={options2.filter((opt) => opt.label !== anime1)}
            value={anime2}
            onChange={(_, val) => setAnime2(typeof val === 'string' ? val : val?.label || '')}
            onInputChange={(_, val) => { setAnime2(val); debouncedLocal2(val); }}
            loading={loading2}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Anime 2"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (<>{loading2 ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</>),
                }}
              />
            )}
            sx={{ width: { xs: '100%', sm: 280, md: 320 } }}
          />

          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={handleSearch}>Search</Button>
        </Box>

        <ActiveChips />

        {/* Scrollable results area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            {loadingList
              ? 'Loading results...'
              : `Found ${totalCount || 0} result${totalCount === 1 ? '' : 's'}`}
          </Typography>

          <Grid container spacing={2}>
            {loadingList
              ? Array.from({ length: 12 }).map((_, i) => (
                  <Grid key={i} item xs={12} sm={6} md={4} lg={3}>
                    <Card sx={{ borderRadius: 3 }}>
                      <Skeleton variant="rectangular" height={220} />
                      <Box sx={{ p: 2 }}>
                        <Skeleton width="60%" />
                        <Skeleton width="90%" />
                        <Skeleton width="80%" />
                      </Box>
                    </Card>
                  </Grid>
                ))
              : animeList.length > 0
              ? animeList.map((anime, idx) => (
                  <Grid key={idx} item xs={12} sm={6} md={4} lg={3}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'transform 120ms ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                      }}
                    >
                      <CardActionArea sx={{ alignItems: 'stretch' }}>
                        <CardMedia
                          component="img"
                          height="220"
                          image={anime['Image URL'] || '/fallback-image.jpg'}
                          alt={anime.Name}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/fallback-image.jpg'; }}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ minHeight: 150 }}>
                          <Tooltip title={anime.Name}>
                            <Typography variant="subtitle1" fontWeight={700} noWrap>
                              {anime.Name}
                            </Typography>
                          </Tooltip>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', mt: 0.5 }}
                          >
                            {anime.Synopsis || ''}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                            <Chip size="small" label={`⭐ ${anime.Score ?? '-'}`} />
                            <Chip size="small" label={anime.Aired || '—'} />
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))
              : (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 3,
                      p: 6,
                      textAlign: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>No results</Typography>
                    <Typography variant="body2">
                      Try adjusting filters or search terms, then hit <b>Search</b>.
                    </Typography>
                    <Button sx={{ mt: 2 }} variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </Box>
                </Grid>
              )}
          </Grid>

          {!loadingList && totalCount > PAGE_SIZE && (
            <Box mt={3} display="flex" justifyContent="center">
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
