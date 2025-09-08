// src/pages/Result.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  TextField,
  Autocomplete,
  CircularProgress,
  Button,
  MenuItem,
  Divider,
  Pagination,
} from '@mui/material';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { fetchTitles, api } from '../api';

interface IAnime {
  _id: string;
  title_userPreferred?: string;
  title_english?: string;
  title_romaji: string;
  bannerImage?: string;
  siteUrl?: string;
  averageScore?: number;
  popularity?: number;
  episodes?: number;
  duration?: number;
  startDate_year?: number;
  startDate_month?: number;
  startDate_day?: number;
  genres?: string[];
  description?: string;
}

interface AnimeOption { label: string }

const PAGE_SIZE = 25;

const Result: React.FC = () => {
  const { state } = useLocation() as { state?: { anime1?: string; anime2?: string } };
  const navigate = useNavigate();

  // Search state
  const [anime1, setAnime1] = useState<string>(state?.anime1 || '');
  const [anime2, setAnime2] = useState<string>(state?.anime2 || '');

  // Suggestions
  const [opts1, setOpts1] = useState<AnimeOption[]>([]);
  const [opts2, setOpts2] = useState<AnimeOption[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  // Filters (list mode)
  const [sort, setSort] = useState<'score' | 'popularity' | 'year'>('score');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [minScore, setMinScore] = useState<string>(''); // numeric string
  const [maxScore, setMaxScore] = useState<string>('');
  const [afterYear, setAfterYear] = useState<string>(''); // numeric string
  const [beforeYear, setBeforeYear] = useState<string>('');
  const [genre, setGenre] = useState<string>('');

  // Data & pagination
  const [rows, setRows] = useState<IAnime[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // Helpers
  const isCompareMode = anime1.trim().length > 0 && anime2.trim().length > 0;

  const prettyDate = (y?: number, m?: number, d?: number) =>
    y ? `${y}${m ? `-${String(m).padStart(2, '0')}` : ''}${d ? `-${String(d).padStart(2, '0')}` : ''}` : '—';

  // Debounced suggesters
  const runFetchTitles = async (
    q: string,
    setter: React.Dispatch<React.SetStateAction<AnimeOption[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!q || q.trim().length < 2) {
      setter([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetchTitles(q.trim(), 10);
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
      console.error(e);
      setter([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch1 = useMemo(
    () => debounce((q: string) => runFetchTitles(q, setOpts1, setLoading1), 250),
    []
  );
  const debouncedFetch2 = useMemo(
    () => debounce((q: string) => runFetchTitles(q, setOpts2, setLoading2), 250),
    []
  );

  useEffect(() => {
    return () => {
      debouncedFetch1.cancel();
      debouncedFetch2.cancel();
    };
  }, [debouncedFetch1, debouncedFetch2]);

  // Fetchers
  const fetchCompare = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = { anime1: anime1.trim(), anime2: anime2.trim(), sort, order };
      const { data } = await api.get('/api/anime', { params });
      setRows(data?.results || []);
      setTotal(2);
    } catch (e) {
      console.error(e);
      setErr('Failed to fetch comparison.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [anime1, anime2, sort, order]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const params: any = {
        sort, order,
        page, limit: PAGE_SIZE,
      };
      if (minScore) params.minScore = minScore;
      if (maxScore) params.maxScore = maxScore;
      if (afterYear) params.afterYear = afterYear;
      if (beforeYear) params.beforeYear = beforeYear;
      if (genre) params.genre = genre;

      const { data } = await api.get('/api/anime', { params });
      setRows(data?.results || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error(e);
      setErr('Failed to fetch list.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [sort, order, page, minScore, maxScore, afterYear, beforeYear, genre]);

  // Initial load + when state changes
  useEffect(() => {
    // Reset page when filters change (list mode)
    if (!isCompareMode) setPage(1);
  }, [sort, order, minScore, maxScore, afterYear, beforeYear, genre, isCompareMode]);

  useEffect(() => {
    if (isCompareMode) fetchCompare();
    else fetchList();
  }, [isCompareMode, fetchCompare, fetchList, page]);

  // Actions
  const onSearchClick = () => {
    // if both filled, compare; else list with filters
    if (isCompareMode) fetchCompare();
    else fetchList();
    // also push state so refresh keeps inputs
    navigate('/results', { replace: true, state: { anime1: anime1 || undefined, anime2: anime2 || undefined } });
  };

  const onClearSearch = () => {
    setAnime1('');
    setAnime2('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        {isCompareMode ? 'Compare' : 'Browse Anime'}
      </Typography>

      {/* Search + Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo
                options={opts1.filter(o => !anime2 || o.label.toLowerCase() !== anime2.toLowerCase())}
                loading={loading1}
                onInputChange={(_, value) => { setAnime1(value); debouncedFetch1(value); }}
                value={anime1}
                onChange={(_, value) => setAnime1(typeof value === 'string' ? value : value?.label || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Anime 1"
                    placeholder="Type to search…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading1 ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSearchClick(); }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                freeSolo
                options={opts2.filter(o => !anime1 || o.label.toLowerCase() !== anime1.toLowerCase())}
                loading={loading2}
                onInputChange={(_, value) => { setAnime2(value); debouncedFetch2(value); }}
                value={anime2}
                onChange={(_, value) => setAnime2(typeof value === 'string' ? value : value?.label || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Anime 2"
                    placeholder="Type to search…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading2 ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSearchClick(); }}
                  />
                )}
              />
            </Grid>

            {/* Sort / Order */}
            <Grid item xs={6} md={2}>
              <TextField
                select
                label="Sort"
                fullWidth
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
              >
                <MenuItem value="score">Score</MenuItem>
                <MenuItem value="popularity">Popularity</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                select
                label="Order"
                fullWidth
                value={order}
                onChange={(e) => setOrder(e.target.value as any)}
              >
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </TextField>
            </Grid>

            {/* Line break */}
            <Grid item xs={12}><Divider /></Grid>

            {/* Filters (list mode only) */}
            {!isCompareMode && (
              <>
                <Grid item xs={6} md={2.4}>
                  <TextField
                    label="Min Score"
                    type="number"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <TextField
                    label="Max Score"
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <TextField
                    label="After Year"
                    type="number"
                    value={afterYear}
                    onChange={(e) => setAfterYear(e.target.value)}
                    fullWidth
                    inputProps={{ min: 1900, max: 2100 }}
                  />
                </Grid>
                <Grid item xs={6} md={2.4}>
                  <TextField
                    label="Before Year"
                    type="number"
                    value={beforeYear}
                    onChange={(e) => setBeforeYear(e.target.value)}
                    fullWidth
                    inputProps={{ min: 1900, max: 2100 }}
                  />
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <TextField
                    label="Genre"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    fullWidth
                    placeholder="e.g. Fantasy"
                  />
                </Grid>
              </>
            )}

            {/* Actions */}
            <Grid item xs={12} display="flex" gap={1} justifyContent="flex-end">
              <Button variant="outlined" onClick={onClearSearch}>Clear Search</Button>
              <Button variant="contained" onClick={onSearchClick}>Search</Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Error */}
      {err && (
        <Typography color="error" sx={{ mb: 2 }}>
          {err}
        </Typography>
      )}

      {/* Results */}
      {loading ? (
        <Stack spacing={2}>
          <Card><Box sx={{ height: 120 }} /></Card>
          <Card><Box sx={{ height: 120 }} /></Card>
          <Card><Box sx={{ height: 120 }} /></Card>
        </Stack>
      ) : (
        <>
          <Grid container spacing={2}>
            {rows.map((a) => {
              const title = a.title_userPreferred || a.title_english || a.title_romaji;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={a._id}>
                  <Card
                    component={RouterLink}
                    to={`/results/${a._id}`}
                    elevation={3}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 120ms ease',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    {a.bannerImage && (
                      <CardMedia
                        component="img"
                        image={a.bannerImage}
                        alt={title}
                        sx={{ height: 140, objectFit: 'cover' }}
                        loading="lazy"
                      />
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {a.title_english && a.title_english !== a.title_userPreferred
                          ? a.title_english
                          : a.title_romaji}
                      </Typography>

                      {/* Stats: only Score + Duration */}
                      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" label={`Score: ${a.averageScore ?? '—'}`} />
                        <Chip size="small" label={`Dur: ${a.duration ?? '—'}m`} />
                      </Stack>

                      {/* Genres */}
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {(a.genres || []).slice(0, 4).map((g) => (
                          <Chip key={g} size="small" label={g} variant="outlined" />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination only in list mode */}
          {!isCompareMode && total > PAGE_SIZE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                page={page}
                count={totalPages}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}

          {/* Empty state */}
          {!loading && rows.length === 0 && (
            <Typography sx={{ mt: 2 }}>
              No results. Try adjusting filters or search terms.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default Result;
