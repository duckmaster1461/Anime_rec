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

const ResultDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Details</Typography>
      </Stack>

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={180} />
          <Skeleton variant="rectangular" height={300} />
        </Stack>
      ) : err ? (
        <Typography color="error">{err}</Typography>
      ) : !row ? (
        <Typography>No data.</Typography>
      ) : (
        <Stack spacing={3}>
          {/* Hero */}
          <Card elevation={3} sx={{ overflow: 'hidden' }}>
            {row.bannerImage && (
              <CardMedia
                component="img"
                image={row.bannerImage}
                alt={title}
                sx={{ maxHeight: 240, objectFit: 'cover' }}
                loading="lazy"
              />
            )}
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {(row.title_english && row.title_english !== row.title_userPreferred) ? row.title_english : row.title_romaji}
                    {row.title_native ? ` • ${row.title_native}` : ''}
                  </Typography>
                </Box>
                {row.siteUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<LaunchIcon />}
                    href={row.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    AniList
                  </Button>
                )}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                {row.format && <Chip label={row.format} size="small" />}
                {row.source && <Chip label={`Source: ${row.source}`} size="small" />}
                {row.countryOfOrigin && <Chip label={row.countryOfOrigin} size="small" />}
                {row.isAdult ? <Chip color="error" label="18+" size="small" /> : null}
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2">Episodes: <b>{row.episodes ?? '—'}</b></Typography>
                <Typography variant="body2">Duration: <b>{row.duration ? `${row.duration}m` : '—'}</b></Typography>
                <Typography variant="body2">Score: <b>{row.averageScore ?? '—'}</b></Typography>
                <Typography variant="body2">Popularity: <b>{row.popularity ?? '—'}</b></Typography>
                <Typography variant="body2">
                  Start: <b>{prettyDate(row.startDate_year, row.startDate_month, row.startDate_day)}</b>
                </Typography>
                <Typography variant="body2">
                  End: <b>{prettyDate(row.endDate_year, row.endDate_month, row.endDate_day)}</b>
                </Typography>
              </Stack>

              {row.genres && row.genres.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {row.genres.slice(0, 10).map((g) => (
                    <Chip key={g} label={g} variant="outlined" size="small" />
                  ))}
                </Stack>
              )}

              {row.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                    dangerouslySetInnerHTML={{
                      __html: row.description
                        .replace(/\\u003Cbr\\u003E/g, '<br>')
                        .replace(/<br\s*\/?>/g, '<br/>'),
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {/* External Links */}
            {row.externalLinks && row.externalLinks.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      External Links
                    </Typography>
                    <Stack spacing={1}>
                      {row.externalLinks.map((l, idx) => (
                        <Stack key={`${l.url}-${idx}`} direction="row" alignItems="center" spacing={1}>
                          {l.icon && (
                            <img src={l.icon} alt="" width={16} height={16} style={{ display: 'inline-block' }} loading="lazy" />
                          )}
                          <a href={l.url} target="_blank" rel="noreferrer">{l.site}</a>
                          {l.type ? <Chip size="small" label={l.type} /> : null}
                          {l.language ? <Chip size="small" label={l.language} /> : null}
                          {l.notes ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>• {l.notes}</Typography> : null}
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Streaming episodes */}
            {row.streamingEpisodes && row.streamingEpisodes.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Streaming Episodes
                    </Typography>
                    <Stack spacing={1.5}>
                      {row.streamingEpisodes.map((e, i) => (
                        <Stack key={`${e.title}-${i}`} direction="row" spacing={1.5} alignItems="center">
                          {e.thumbnail && (
                            <img src={e.thumbnail} alt="" width={80} height={45} style={{ objectFit: 'cover', borderRadius: 6 }} loading="lazy" />
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap title={e.title}><b>{e.title}</b></Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{e.site || ''}</Typography>
                            {e.url && (
                              <Typography variant="caption" sx={{ ml: 1 }}>
                                <a href={e.url} target="_blank" rel="noreferrer">Watch</a>
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Tags */}
            {row.tags && row.tags.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Tags
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {row.tags.map((t) => (
                        <Chip
                          key={t.id}
                          size="small"
                          label={`${t.name}${t.rank ? ` (${t.rank})` : ''}`}
                          color={t.isAdult ? 'error' : t.isGeneralSpoiler ? 'warning' : 'default'}
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Relations */}
            {row.relations && row.relations.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Relations
                    </Typography>
                    <Grid container spacing={1.5}>
                      {row.relations.map((r) => {
                        const t = r.node?.title;
                        const relTitle = t?.romaji || t?.english || t?.native || `#${r.node?.id}`;
                        return (
                          <Grid item xs={12} sm={6} md={4} key={r.id}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2"><b>{relTitle}</b></Typography>
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

            {/* Studios */}
            {row.studios && row.studios.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Studios
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {row.studios.map((s) => (
                        <Chip
                          key={s.id}
                          label={`${s.node?.name}${s.isMain ? ' (Main)' : ''}`}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Stack>
      )}
    </Box>
  );
};

export default ResultDetail;
