import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LinkIcon from "@mui/icons-material/Link";

type ExternalLink = { url: string; site?: string };

type Anime = {
  _id: string;

  // normalized by server
  uiTitle?: string | null;
  uiYear?: number | null;
  uiScore?: number | null;
  uiFormat?: string | null;
  uiPopularity?: number | null;
  uiGenres?: string[];
  uiSiteUrl?: string | null;
  uiExternalLinks?: ExternalLink[];

  // raw fallbacks (if server not updated yet)
  title?: { romaji?: string; native?: string; userPreferred?: string };
  title_romaji?: string;
  title_native?: string;
  title_userPreferred?: string;
  Name?: string;
  ["English name"]?: string;
  startDate?: { year?: number };
  endDate?: { year?: number };
  startDate_year?: number;
  endDate_year?: number;
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  genres?: string[];
  siteUrl?: string;
  externalLinks?: ExternalLink[];
};

type ApiListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type MetaResponse = {
  formats: string[];
  minYear: number | null;
  maxYear: number | null;
};

const API_BASE = "http://localhost:5000/api/anime";

const useDebouncedValue = <T,>(value: T, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// Client fallbacks (if server not normalized yet)
function pickTitle(a: Anime): string {
  return (
    a.uiTitle ??
    a.title_userPreferred ??
    a.title?.userPreferred ??
    a.title_romaji ??
    a.title?.romaji ??
    a.Name ??
    a["English name"] ??
    a.title_native ??
    a.title?.native ??
    "—"
  );
}
function pickYear(a: Anime): string {
  const y =
    a.uiYear ??
    a.startDate_year ??
    a.startDate?.year ??
    a.endDate_year ??
    a.endDate?.year ??
    null;
  return y ? String(y) : "—";
}
function pickScore(a: Anime): string {
  const s =
    a.uiScore ??
    (typeof a.averageScore === "number" ? a.averageScore : undefined) ??
    (typeof a.meanScore === "number" ? a.meanScore : undefined);
  return typeof s === "number" ? `${s}/100` : "—";
}
function pickFormat(a: Anime): string {
  return a.uiFormat ?? "—";
}

function pickPopularity(a: Anime): string {
  const p = a.uiPopularity ?? a.popularity ?? null;
  return typeof p === "number" ? p.toLocaleString() : "—";
}
function pickGenres(a: Anime): string[] {
  return a.uiGenres ?? a.genres ?? [];
}
function pickSite(a: Anime): string | null {
  return a.uiSiteUrl ?? a.siteUrl ?? null;
}
function pickLinks(a: Anime): ExternalLink[] {
  return Array.isArray(a.uiExternalLinks) ? a.uiExternalLinks : Array.isArray(a.externalLinks) ? a.externalLinks : [];
}

const Result: React.FC = () => {
  // query state
  const [q, setQ] = useState("");
  const [format, setFormat] = useState<string>("");
  const [isAdult, setIsAdult] = useState<string>(""); // "", "false", "true"
  const [year, setYear] = useState<string>("");
  const [sort, setSort] = useState<string>("-popularity");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(24);

  // data state
  const [items, setItems] = useState<Anime[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<MetaResponse>({ formats: [], minYear: null, maxYear: null });

  const debouncedQ = useDebouncedValue(q, 400);

  // reset page when filters/search change
  const prevKey = useRef<string>("");
  const key = useMemo(
    () => JSON.stringify({ q: debouncedQ, format, isAdult, year, sort, limit }),
    [debouncedQ, format, isAdult, year, sort, limit]
  );
  useEffect(() => {
    if (prevKey.current !== key) {
      setPage(1);
      prevKey.current = key;
    }
  }, [key]);

  // fetch meta once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/meta`);
        if (!r.ok) throw new Error(`Meta HTTP ${r.status}`);
        const data: MetaResponse = await r.json();
        if (alive) setMeta(data);
      } catch {
        // meta optional
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // fetch list
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
        if (format) params.set("format", format);
        if (isAdult) params.set("isAdult", isAdult);
        if (year.trim()) params.set("year", year.trim());
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (sort) params.set("sort", sort);

        const r = await fetch(`${API_BASE}?${params.toString()}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data: ApiListResponse<Anime> = await r.json();
        if (!alive) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to fetch");
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debouncedQ, format, isAdult, year, page, limit, sort]);

  const clearAll = () => {
    setQ("");
    setFormat("");
    setIsAdult("");
    setYear("");
    setSort("-popularity");
    setLimit(24);
    setPage(1);
    const el = document.getElementById("search-input") as HTMLInputElement | null;
    if (el) el.value = "";
  };

  const perPageOptions = [12, 24, 48, 96];

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", px: { xs: 2, md: 4 }, py: 2, maxWidth: 1440, mx: "auto" }}>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 2 }}>
        Anime Results
      </Typography>

      {/* Controls */}
      <Stack direction="row" spacing={2} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <TextField
          id="search-input"
          placeholder="Search title, genre, tag…"
          defaultValue={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="format-label">Format</InputLabel>
          <Select
            labelId="format-label"
            value={format}
            label="Format"
            onChange={(e) => setFormat(e.target.value)}
          >
            <MenuItem value=""><em>All Formats</em></MenuItem>
            {meta.formats.map((f) => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="adult-label">Audience</InputLabel>
          <Select
            labelId="adult-label"
            value={isAdult}
            label="Audience"
            onChange={(e) => setIsAdult(e.target.value)}
          >
            <MenuItem value=""><em>All Audiences</em></MenuItem>
            <MenuItem value="false">Non-Adult</MenuItem>
            <MenuItem value="true">Adult</MenuItem>
          </Select>
        </FormControl>

        <TextField
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/[^\d]/g, ""))}
          size="small"
          inputMode="numeric"
          placeholder={meta.minYear && meta.maxYear ? `Year (${meta.minYear}-${meta.maxYear})` : "Year"}
          sx={{ width: 140 }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="sort-label">Sort</InputLabel>
          <Select
            labelId="sort-label"
            value={sort}
            label="Sort"
            onChange={(e) => setSort(e.target.value)}
          >
            <MenuItem value="-popularity">Popularity ↓</MenuItem>
            <MenuItem value="-averageScore">Avg Score ↓</MenuItem>
            <MenuItem value="-createdAt">Newest ↓</MenuItem>
            <MenuItem value="title_romaji">Title A→Z</MenuItem>
            <MenuItem value="-title_romaji">Title Z→A</MenuItem>
            <MenuItem value="startDate_year">Year ↑</MenuItem>
            <MenuItem value="-startDate_year">Year ↓</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="limit-label">Per Page</InputLabel>
          <Select
            labelId="limit-label"
            value={String(limit)}
            label="Per Page"
            onChange={(e) => setLimit(Number(e.target.value) || 24)}
          >
            {perPageOptions.map((n) => (
              <MenuItem key={n} value={n}>{n} / page</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <ToggleButtonGroup
          exclusive
          value="clear"
          onChange={clearAll as any}
          size="small"
          sx={{ "& .MuiToggleButton-root": { textTransform: "none" } }}
        >
          <ToggleButton value="clear">Clear</ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="body2" color="text.secondary">
          {loading ? "Loading…" : `${total.toLocaleString()} result${total === 1 ? "" : "s"}`}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Scrollable grid area */}
        <Box sx={{ overflowY: "auto", pr: 0.5 }}>
          {err && (
            <Card sx={{ mb: 2, borderColor: "error.light" }}>
              <CardContent>
                <Typography color="error.main" fontWeight={600}>Error</Typography>
                <Typography variant="body2">{err}</Typography>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !err && items.length === 0 && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8, color: "text.secondary" }} spacing={1}>
              <Typography variant="h6">No results</Typography>
              <Typography variant="body2">Try a different search or clear filters.</Typography>
            </Stack>
          )}

          {/* Grid */}
          <Grid container spacing={2}>
            {loading
              ? Array.from({ length: limit }).map((_, i) => (
                  <Grid item key={`sk-${i}`} xs={12} sm={6} md={4} lg={3} xl={2.4 as any}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Skeleton variant="text" width="80%" height={28} />
                        <Skeleton variant="text" width="50%" />
                        <Skeleton variant="rectangular" height={80} sx={{ my: 1.5, borderRadius: 2 }} />
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="50%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : items.map((a) => {
                  const title = pickTitle(a);
                  const subLeft = pickFormat(a);
                  const subRight = pickYear(a);
                  const genres = pickGenres(a);
                  const score = pickScore(a);
                  const popularity = pickPopularity(a);
                  const site = pickSite(a);
                  const links = pickLinks(a);

                  return (
                    <Grid item key={a._id} xs={12} sm={6} md={4} lg={3} xl={2.4 as any}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          transition: "box-shadow .2s ease",
                          "&:hover": { boxShadow: 4 },
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        variant="outlined"
                      >
                        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                            {title}
                          </Typography>
                          <Stack direction="row" justifyContent="space-between" sx={{ color: "text.secondary" }}>
                            <Typography variant="body2">{subLeft}</Typography>
                            <Typography variant="body2">{subRight}</Typography>
                          </Stack>

                          {genres.length > 0 && (
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                              {genres.slice(0, 4).map((g) => (
                                <Chip key={g} label={g} size="small" variant="outlined" />
                              ))}
                              {genres.length > 4 && (
                                <Chip label={`+${genres.length - 4}`} size="small" variant="outlined" />
                              )}
                            </Stack>
                          )}

                          <Divider sx={{ my: 1 }} />

                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Score</Typography>
                            <Typography variant="body2" fontWeight={600}>{score}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Popularity</Typography>
                            <Typography variant="body2" fontWeight={600}>{popularity}</Typography>
                          </Stack>

                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {site && (
                              <Tooltip title="Official Site">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={site}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {links.slice(0, 2).map((l, idx) => (
                              <Tooltip key={idx} title={l.site || l.url}>
                                <IconButton size="small" component="a" href={l.url} target="_blank" rel="noreferrer">
                                  <LinkIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
          </Grid>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Stack alignItems="center" sx={{ my: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Result;
