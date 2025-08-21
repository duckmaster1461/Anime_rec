import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Stack, Typography, Divider } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { dummyAnimeList, Anime } from "../data/dummyAnimeData";

// Reuse helpers similar to Result.tsx
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const getTitle = (a: Anime) =>
  a.title_userPreferred || a.title_romaji || a.title_native || "—";

const getYear = (a: Anime) => a.startDate_year ?? a.endDate_year ?? null;

const getScoreNum = (a: Anime) =>
  typeof a.averageScore === "number"
    ? a.averageScore
    : typeof a.meanScore === "number"
    ? a.meanScore
    : null;

// title-based placeholder fallback
const posterFromTitle = (title: string) =>
  `https://placehold.co/600x840?text=${encodeURIComponent(title || "No Image")}`;

const getPoster = (a: Anime) => (a as any).imageUrl || posterFromTitle(getTitle(a));

const ResultDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const anime = useMemo(() => {
    if (!slug) return null;
    return dummyAnimeList.find((a) => slugify(getTitle(a)) === slug) || null;
  }, [slug]);

  if (!anime) {
    return (
      <Box sx={{ p: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We couldn’t find that anime. Try going back to the results.
        </Typography>
      </Box>
    );
  }

  const title = getTitle(anime);
  const poster = getPoster(anime);
  const year = getYear(anime);
  const score = getScoreNum(anime);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
        Back to results
      </Button>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 2 }}>
        <Box
          component="img"
          src={poster}
          alt={title}
          onError={(e: any) => (e.currentTarget.src = posterFromTitle(title))}
          sx={{
            width: { xs: "100%", md: 360 },
            height: { xs: "auto", md: 520 },
            objectFit: "cover",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        />

        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight={800}>
            {title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            {year && <Chip label={`Year: ${year}`} size="small" />}
            {anime.format && <Chip label={anime.format} size="small" />}
            {typeof score === "number" && <Chip label={`⭐ ${score}/100`} size="small" />}
            {anime.countryOfOrigin && <Chip label={anime.countryOfOrigin} size="small" />}
            {anime.episodes && <Chip label={`${anime.episodes} eps`} size="small" />}
            {anime.duration && <Chip label={`${anime.duration} min/ep`} size="small" />}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight={700}>
            Overview
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-line" }}>
            {anime.description || "No description."}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
            {anime.genres?.map((g) => <Chip key={g} label={g} size="small" variant="outlined" />)}
            {anime.tags?.map((t) => <Chip key={t.id} label={t.name} size="small" variant="outlined" />)}
          </Stack>

          {anime.siteUrl && (
            <Button
              sx={{ mt: 3 }}
              variant="contained"
              onClick={() => window.open(anime.siteUrl!, "_blank", "noopener,noreferrer")}
            >
              View on AniList
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default ResultDetail;
