import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import debounce from 'lodash.debounce';
import {
  Box, Typography, TextField, Autocomplete, Button, Pagination,
  Slider, RadioGroup, Radio, FormControlLabel, FormLabel, Select, MenuItem,
  CircularProgress, Grid, Card, CardActionArea, CardMedia, CardContent,
  Chip, Stack, Tooltip, Accordion, AccordionSummary, AccordionDetails, Skeleton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// 🔁 Use your long-schema dummy data + type
import { dummyAnimeList, Anime as Anime } from '../data/dummyAnimeData';

const PAGE_SIZE = 50;

// Helpers to read mixed fields safely
const getTitle = (a: Anime) =>
  a.title_userPreferred || a.title_romaji || a.title_native || '—';

const getYear = (a: Anime) =>
  a.startDate_year ?? a.endDate_year ?? null;

const getScoreNum = (a: Anime) =>
  typeof a.averageScore === 'number'
    ? a.averageScore
    : typeof a.meanScore === 'number'
    ? a.meanScore
    : null;

const getDesc = (a: Anime) => a.description || '';

const posterFromTitle = (title: string) =>
  `https://placehold.co/300x420?text=${encodeURIComponent(title || 'No Image')}`;

const getPoster = (a: Anime) =>
  // if you later add a.imageUrl, it will be used; otherwise generate a placeholder
  (a as any).imageUrl || posterFromTitle(getTitle(a));

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
  const [rating, setRating] = useState<number[]>([0, 100]); // /100 to match averageScore
  const [sortField, setSortField] = useState('Score');

  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);

  const sortMap: Record<string, string> = {
    Score: 'averageScore',
    Aired: 'startDate_year',
    // kept for future server mode
    Popularity: 'popularity',
    Episodes: 'episodes',
    Duration: 'duration',
    Favorites: 'favorites',
    Ranked: 'ranked',
    Members: 'members',
  };

  // ---- OFFLINE TITLE SEARCH (against long schema) ----
  const allTitleOptions = useMemo(
    () => dummyAnimeList.map(a => ({ label: getTitle(a) })),
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

  // ---- OFFLINE RESULT PIPELINE (long schema) ----
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
    const aftY = (overrides?.afterYear ?? afterYear) || '';
    const befY = (overrides?.beforeYear ?? beforeYear) || '';
    const rate = overrides?.rating ?? rating;
    const sort = overrides?.sortField ?? sortField;

    let list = [...dummyAnimeList];

    const matchTitle = (x: Anime, q: string) =>
      getTitle(x).toLowerCase().includes(q.toLowerCase());

    // OR search: if both are filled, keep items that match either
    if (a1 || a2) {
      list = list.filter(x =>
        (a1 && matchTitle(x, a1)) ||
        (a2 && matchTitle(x, a2))
      );
    }

    // Year filters use startDate_year (fallback to endDate_year)
    const toYear = (x: Anime) => getYear(x) ?? 0;

    if (/^\d{4}$/.test(aftY)) {
      const y = parseInt(aftY, 10);
      list = list.filter(x => toYear(x) >= y);
    }
    if (/^\d{4}$/.test(befY)) {
      const y = parseInt(befY, 10);
      list = list.filter(x => toYear(x) <= y);
    }

    // Score filter uses /100 scale from averageScore/meanScore
    const [minR, maxR] = rate;
    list = list.filter(x => {
      const s = getScoreNum(x);
      if (s === null) return false;
      return s >= minR && s <= maxR;
    });

    // Sorting
    const key = (sortMap[sort] || 'averageScore');
    if (key === 'averageScore') {
      list.sort((a, b) => (getScoreNum(b) ?? -1) - (getScoreNum(a) ?? -1));
    } else if (key === 'startDate_year') {
      list.sort((a, b) => (getYear(b) ?? 0) - (getYear(a) ?? 0));
    }

    const total = list.length;
    const start = (pageOverride - 1) * PAGE_SIZE;
    const pageSlice = list.slice(start, start + PAGE_SIZE);

    setTotalCount(total);
    setAnimeList(pageSlice);
    setLoadingList(false);
  };

  // initial + on page change
  useEffect(() => {
    setLoadingList(true);
    const t = setTimeout(() => computeResults(page), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // auto-apply on any filter change
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      computeResults(1);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afterYear, beforeYear, rating, season, anime1, anime2, sortField]);

  const handleSearch = () => {
    setPage(1);
    computeResults(1);
  };

  const handleResetFilters = () => {
    setAnime1('');
    setAnime2('');
    setOptions1([]);
    setOptions2([]);

    setBeforeYear('');
    setAfterYear('');
    setSeason('');
    setRating([0, 100]);
    setSortField('Score');

    setPage(1);
    computeResults(1, {
      anime1: '',
      anime2: '',
      afterYear: '',
      beforeYear: '',
      rating: [0, 100],
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
            onChange={(e) => setAfterYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="e.g. 2015"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 4 }}
          />
          <TextField
            label="Before"
            fullWidth
            size="small"
            value={beforeYear}
            onChange={(e) => setBeforeYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="e.g. 2022"
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 4 }}
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
        <Typography variant="subtitle2" gutterBottom>Score (0–100)</Typography>
        <Slider value={rating} onChange={(_, v) => setRating(v as number[])} valueLabelDisplay="auto" min={0} max={100} />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>Sort by</Typography>
        <Select value={sortField} onChange={(e) => setSortField(e.target.value as string)} fullWidth size="small">
          <MenuItem value="Score">Score</MenuItem>
          <MenuItem value="Aired">Aired (Year)</MenuItem>
          {/* Future server-side sorts */}
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
    if (rating[0] !== 0 || rating[1] !== 100) chips.push({ label: `Score: ${rating[0]}–${rating[1]}`, onDelete: () => setRating([0, 100]) });
    if (!chips.length) return null;
    return (
      <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1, flexWrap: 'wrap', gap: 1 }}>
        {chips.map((c, i) => <Chip key={i} label={c.label} onDelete={c.onDelete} variant="outlined" size="small" />)}
      </Stack>
    );
  };

  return (
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

        {/* Sticky search row */}
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
              ? animeList.map((a, idx) => {
                  const title = getTitle(a);
                  const year = getYear(a);
                  const score = getScoreNum(a);
                  const desc = getDesc(a);
                  const poster = getPoster(a);

                  return (
                    <Grid key={idx} item xs={12} sm={6} md={4} lg={3}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'transform 120ms ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <CardActionArea sx={{ alignItems: 'stretch' }}>
                          <CardMedia
                            component="img"
                            height="220"
                            image={poster}
                            alt={title}
                            // if external image fails, swap to text placeholder
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.src = posterFromTitle(title);
                            }}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent sx={{ minHeight: 150 }}>
                            <Tooltip title={title}>
                              <Typography variant="subtitle1" fontWeight={700} noWrap>
                                {title}
                              </Typography>
                            </Tooltip>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', mt: 0.5 }}
                            >
                              {desc}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                              <Chip size="small" label={`⭐ ${score ?? '—'}/100`} />
                              <Chip size="small" label={year ?? '—'} />
                            </Stack>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })
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
