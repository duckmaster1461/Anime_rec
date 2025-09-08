// src/api.ts
import axios from "axios";

/**
 * Resolve API base URL (CRA only).
 * 1) Prefer REACT_APP_API_BASE from .env
 * 2) If localhost -> http://localhost:5000
 * 3) Otherwise -> same-origin "/"
 */
function resolveApiBase(): string {
  const envBase = process.env.REACT_APP_API_BASE;

  if (envBase && envBase.trim()) {
    return envBase.replace(/\/+$/, ""); // strip trailing slash
  }

  const isLocalhost =
    /^localhost$|^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname) ||
    window.location.hostname.endsWith(".local");

  if (isLocalhost) return "http://localhost:5000";

  return "/";
}

export const api = axios.create({
  baseURL: resolveApiBase(),
  timeout: 10000,
});

// ---- Domain helpers ----

// Titles
export async function fetchTitles(q: string, limit = 10) {
  const { data } = await api.get("/api/anime/titles", { params: { q, limit } });
  // expect [{label: string}, ...]
  return Array.isArray(data) ? data : [];
}

// Compare
export async function fetchCompare(anime1: string, anime2: string) {
  const params = { anime1, anime2, sort: "score", order: "desc" };
  const { data } = await api.get("/api/anime", { params });
  // expect { results: IAnimeFinal[], total?: number }
  return data;
}
