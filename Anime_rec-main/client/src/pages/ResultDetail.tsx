// src/pages/ResultDetail.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Grid,
  Divider,
  IconButton,
  Skeleton,
  Button,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LaunchIcon from '@mui/icons-material/Launch';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

interface Tag {
  id: number;
  name: string;
  category?: string | null;
  rank?: number | null;
  isGeneralSpoiler?: boolean;
  isMediaSpoiler?: boolean;
  isAdult?: boolean;
}
interface ExternalLink {
  id?: number;
  url: string;
  site: string;
  type?: string;
  language?: string | null;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
  isDisabled?: boolean;
}
interface StreamingEpisode {
  title: string;
  thumbnail?: string;
  url?: string;
  site?: string;
}
interface RelationNodeTitle { romaji?: string|null; english?: string|null; native?: string|null; }
interface RelationNode { id: number; title?: RelationNodeTitle; type?: string; format?: string; status?: string; }
interface Relation { id: number; relationType: string; node: RelationNode; }
interface StudioNode { id: number; name: string; isAnimationStudio?: boolean; }
interface Studio { id: number; isMain?: boolean; node: StudioNode; }

interface IAnime {
  _id: string;
  title_userPreferred?: string;
  title_english?: string;
  title_romaji: string;
  title_native?: string;
  bannerImage?: string;
  siteUrl?: string;

  description?: string;
  format?: string;
  source?: string;
  countryOfOrigin?: string;

  startDate_year?: number;
  startDate_month?: number;
  startDate_day?: number;
  endDate_year?: number;
  endDate_month?: number;
  endDate_day?: number;

  episodes?: number;
  duration?: number;
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  isAdult?: boolean;

  genres?: string[];
  synonyms?: string[];

  externalLinks?: ExternalLink[];
  streamingEpisodes?: StreamingEpisode[];
  tags?: Tag[];
  relations?: Relation[];
  studios?: Studio[];
}

const prettyDate = (y?: number, m?: number, d?: number) =>
  y ? `${y}${m ? `-${String(m).padStart(2, '0')}` : ''}${d ? `-${String(d).padStart(2, '0')}` : ''}` : '—';

const sanitizeDesc = (s?: string) =>
  (s || '')
    .replace(/\\u003Cbr\\u003E/gi, '<br/>')
    .replace(/<br\s*\/?>/gi, '<br/>');

const ResultDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:900px)');

  const [row, setRow] = useState<IAnime | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/results', { replace: true });
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data } = await api.get(`/api/anime/${id}`);
        setRow(data);
      } catch (e: any) {
        console.error(e);
        setErr('Failed to load anime.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const title = useMemo(
    () => row?.title_userPreferred || row?.title_english || row?.title_romaji || '',
    [row]
  );
  const subtitle = useMemo(() => {
    if (!row) return '';
    const base = row.title_english && row.title_english !== row.title_userPreferred
      ? row.title_english
      : row.title_romaji;
    return row.title_native ? `${base} • ${row.title_native}` : base;
  }, [row]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero with banner + overlay */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 180, sm: 220, md: 280 },
          bgcolor: '#0b0b0b',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {loading ? (
          <Skeleton variant="rectangular" sx={{ height: '100%' }} />
        ) : row?.bannerImage ? (
          <CardMedia
            component="img"
            image={row.bannerImage}
            alt={title}
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              filter: 'contrast(1.05) saturate(1.05)',
            }}
            loading="lazy"
          />
        ) : null}

        {/* dark gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 55%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Top action bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}
            aria-label="Back"
          >
            <ArrowBackIcon />
          </IconButton>

          {row?.siteUrl && (
            <Button
              variant="contained"
              size="small"
              endIcon={<LaunchIcon />}
              href={row.siteUrl}
              target="_blank"
              rel="noreferrer"
              sx={{
                textTransform: 'none',
                borderRadius: 999,
                px: 2,
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              }}
            >
              Open on AniList
            </Button>
          )}
        </Box>

        {/* Title on hero */}
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 16, md: '50%' },
            right: { xs: 16, md: 16 },
            bottom: 16,
            transform: { md: 'translateX(-50%)' },
            width: { md: 'min(1200px, 100% - 32px)' },
            mx: 'auto',
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.1 }}
          >
            {loading ? <Skeleton width={220} /> : title}
          </Typography>
          <Typography
            variant="body2"
            sx={{ opacity: 0.9, mt: 0.5, display: 'block' }}
          >
            {loading ? <Skeleton width={320} /> : subtitle}
          </Typography>

          {/* Meta chips */}
          {!loading && row && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {row.format && (
                <Chip
                  label={row.format}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(4px)' }}
                />
              )}
              {row.source && (
                <Chip
                  label={`Source: ${row.source}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(4px)' }}
                />
              )}
              {row.countryOfOrigin && (
                <Chip
                  label={row.countryOfOrigin}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(4px)' }}
                />
              )}
              {row.isAdult && (
                <Chip
                  color="error"
                  label="18+"
                  size="small"
                  sx={{ bgcolor: 'rgba(244,67,54,0.9)', color: '#fff' }}
                />
              )}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Content container */}
      <Box sx={{ px: { xs: 2, md: 4 }, mt: { xs: -4, md: -6 } }}>
        <Box
          sx={{
            maxWidth: 1200,
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2.2fr 1fr' },
            gap: 2.5,
          }}
        >
          {/* Left column: overview */}
          <Card
            elevation={4}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              backdropFilter: 'blur(6px)',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              {/* Quick stats */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Stat label="Score" value={row?.averageScore ?? '—'} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stat label="Popularity" value={row?.popularity ?? '—'} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stat label="Episodes" value={row?.episodes ?? '—'} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stat label="Duration" value={row?.duration ? `${row?.duration}m` : '—'} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stat label="Start" value={prettyDate(row?.startDate_year, row?.startDate_month, row?.startDate_day)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Stat label="End" value={prettyDate(row?.endDate_year, row?.endDate_month, row?.endDate_day)} />
                </Grid>
              </Grid>

              {/* Genres */}
              {row?.genres && row.genres.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
                  {row.genres.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        borderColor: 'rgba(0,0,0,0.1)',
                        bgcolor: 'rgba(0,0,0,0.03)',
                      }}
                    />
                  ))}
                </Stack>
              )}

              {/* Description */}
              {row?.description && (
                <>
                  <SectionTitle>Overview</SectionTitle>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      '& a': { color: 'primary.main' },
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeDesc(row.description) }}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Right column: links + lists */}
          <Stack spacing={2.5}>
            {/* External Links */}
            {row?.externalLinks && row.externalLinks.length > 0 && (
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <SectionTitle>External Links</SectionTitle>
                  <Stack spacing={1.25}>
                    {row.externalLinks.map((l, idx) => (
                      <Stack
                        key={`${l.url}-${idx}`}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                        }}
                      >
                        {l.icon && (
                          <img
                            src={l.icon}
                            alt=""
                            width={16}
                            height={16}
                            style={{ display: 'inline-block' }}
                            loading="lazy"
                          />
                        )}
                        <a href={l.url} target="_blank" rel="noreferrer">
                          {l.site}
                        </a>
                        <Box sx={{ flex: 1 }} />
                        <Stack direction="row" spacing={0.5}>
                          {l.type ? <Chip size="small" label={l.type} /> : null}
                          {l.language ? <Chip size="small" label={l.language} /> : null}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Streaming Episodes */}
            {row?.streamingEpisodes && row.streamingEpisodes.length > 0 && (
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <SectionTitle>Streaming Episodes</SectionTitle>
                  <Stack spacing={1.25}>
                    {row.streamingEpisodes.map((e, i) => (
                      <Stack key={`${e.title}-${i}`} direction="row" spacing={1.25} alignItems="center">
                        {e.thumbnail && (
                          <img
                            src={e.thumbnail}
                            alt=""
                            width={96}
                            height={54}
                            style={{ objectFit: 'cover', borderRadius: 8 }}
                            loading="lazy"
                          />
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" noWrap title={e.title}>
                            <b>{e.title}</b>
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {e.site || ''}
                          </Typography>
                          {e.url && (
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              <a href={e.url} target="_blank" rel="noreferrer">
                                Watch
                              </a>
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Tags (hide heavy spoilers by default) */}
            {row?.tags && row.tags.length > 0 && (
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <SectionTitle>Tags</SectionTitle>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {row.tags
                      .filter((t) => !t.isGeneralSpoiler && !t.isMediaSpoiler) // keep it clean
                      .map((t) => (
                        <Chip
                          key={t.id}
                          size="small"
                          label={`${t.name}${t.rank ? ` (${t.rank})` : ''}`}
                          color={t.isAdult ? 'error' : 'default'}
                          variant="outlined"
                          sx={{ mb: 1, borderRadius: 999 }}
                        />
                      ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>

        {/* Relations & Studios full width */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 2.5, px: { xs: 0, md: 0 } }}>
          <Grid container spacing={2.5}>
            {row?.relations && row.relations.length > 0 && (
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <SectionTitle>Relations</SectionTitle>
                    <Grid container spacing={1.5}>
                      {row.relations.map((r) => {
                        const t = r.node?.title;
                        const relTitle = t?.romaji || t?.english || t?.native || `#${r.node?.id}`;
                        return (
                          <Grid item xs={12} sm={6} md={4} key={`${r.id}-${r.node?.id}`}>
                            <Stack
                              spacing={0.5}
                              sx={{
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: 'rgba(0,0,0,0.02)',
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {relTitle}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {r.relationType} • {r.node?.format} • {r.node?.status}
                              </Typography>
                            </Stack>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {row?.studios && row.studios.length > 0 && (
              <Grid item xs={12}>
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <SectionTitle>Studios</SectionTitle>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {row.studios.map((s) => (
                        <Chip
                          key={s.id}
                          label={`${s.node?.name}${s.isMain ? ' (Main)' : ''}`}
                          size="small"
                          sx={{
                            mb: 1,
                            borderRadius: 999,
                            bgcolor: s.isMain ? 'rgba(25,118,210,0.1)' : 'rgba(0,0,0,0.03)',
                            border: s.isMain ? '1px solid rgba(25,118,210,0.25)' : '1px solid rgba(0,0,0,0.08)',
                          }}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

/** Small presentational helpers */
const SectionTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Typography
    variant="subtitle1"
    sx={{
      fontWeight: 800,
      letterSpacing: 0.2,
      mb: 1.25,
      textTransform: 'none',
    }}
  >
    {children}
  </Typography>
);

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Stack
    spacing={0.25}
    sx={{
      p: 1.25,
      borderRadius: 2,
      bgcolor: 'rgba(0,0,0,0.02)',
      border: '1px solid rgba(0,0,0,0.06)',
      minHeight: 58,
    }}
  >
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 700 }}>
      {value}
    </Typography>
  </Stack>
);

export default ResultDetail;
