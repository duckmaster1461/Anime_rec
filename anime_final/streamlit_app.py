import json
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

# ==========================
# CONFIG PATHS
# ==========================
ANIME_DB_PATH = Path("ANIME_REC.json")
SIM_PATH = Path("anime_similarity_top50_rank.json")

st.set_page_config(
    page_title="Anime Recommender – Tag Rank Similarity",
    layout="wide",
)

# ==========================
# FULLSCREEN / BACKGROUND FIX (NO LOGIC CHANGES)
# ==========================
st.markdown(
    """
    <style>
    /* Remove Streamlit's default padding so the component can be true edge-to-edge */
    .block-container{
        padding-top: 0rem !important;
        padding-bottom: 0rem !important;
        padding-left: 0rem !important;
        padding-right: 0rem !important;
        max-width: 100% !important;
    }

    /* Hide Streamlit header visually without changing layout sizing */
        header[data-testid="stHeader"]{
        visibility: hidden !important;
        }

        div[data-testid="stToolbar"]{
        visibility: hidden !important;
        }


    /* Make the whole app background match your HTML theme */
    html, body, .stApp{
        background: #050816 !important;
    }

    /* Ensure the embedded HTML iframe uses full width and has no border */
    iframe[title="streamlit.components.v1.html"]{
        width: 100% !important;
        border: 0 !important;
        display: block !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ==========================
# LOAD DATA (CACHED)
# ==========================
@st.cache_data
def load_data():
    # Main anime DB
    with ANIME_DB_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    anime_by_title = {}
    for anime in data:
        title = anime.get("title_romaji") or anime.get("title") or "Untitled"
        title = str(title)
        anime_by_title[title] = anime

    # Precomputed neighbors
    with SIM_PATH.open("r", encoding="utf-8") as f:
        sim_data = json.load(f)

    neighbors = sim_data.get("neighbors", {})
    meta = sim_data.get("meta", {})

    return anime_by_title, neighbors, meta


anime_by_title, neighbors, meta = load_data()

# ==========================
# BUILD COMPACT PAYLOADS FOR FRONTEND
# ==========================
anime_payload = {}
for title, anime in anime_by_title.items():
    anime_payload[title] = {
        "genres": anime.get("genres") or [],
        "averageScore": anime.get("averageScore"),
        "popularity": anime.get("popularity") or 0,
        "siteUrl": anime.get("siteUrl"),
        "bannerImage": anime.get("bannerImage"),
        "trailer_thumbnail": anime.get("trailer_thumbnail"),
        "isAdult": anime.get("isAdult"),
    }

anime_json = json.dumps(anime_payload)
neighbors_json = json.dumps(neighbors)
meta_json = json.dumps(meta)

# ==========================
# FULL CUSTOM HTML APP
# ==========================
html_code = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Anime Recommender – Tag Rank Similarity</title>
<style>
    :root {
        --bg: #050816;
        --bg-elevated: rgba(15, 23, 42, 0.95);
        --border-subtle: rgba(148, 163, 184, 0.25);
        --accent: #6366f1;
        --accent-soft: rgba(99, 102, 241, 0.15);
        --accent-strong: #4f46e5;
        --text-main: #e5e7eb;
        --text-soft: #9ca3af;
        --radius-lg: 18px;
        --shadow-soft: 0 18px 45px rgba(15, 23, 42, 0.75);
    }

    * { box-sizing: border-box; }

    html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: var(--bg);
        overflow: visible;
    }

    body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            "Segoe UI", sans-serif;
        color: var(--text-main);
        background: var(--bg);
    }

    /* Full-bleed background; no centered "container" feel */
    .app-root {
        min-height: 100vh;
        width: 100%;
        padding: 24px;
        background:
            radial-gradient(circle at top left, rgba(56, 189, 248, 0.10), transparent 55%),
            radial-gradient(circle at top right, rgba(129, 140, 248, 0.14), transparent 60%),
            var(--bg);
        display: block;
    }

    /* Make shell full-width (no max-width clamp); keep rounded corners on desktop */
    .app-shell {
        width: 100%;
        max-width: none;
        margin: 0;
        border-radius: 22px;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.30);
        box-shadow: var(--shadow-soft);
        padding: 24px 26px 26px;
        backdrop-filter: blur(26px);
    }

    .app-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-bottom: 18px;
        gap: 16px;
    }

    .app-title-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .app-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .app-logo {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: conic-gradient(from 160deg,
            #22c55e, #22c55e, #22d3ee, #6366f1, #22c55e);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0b1120;
        font-size: 22px;
        font-weight: 800;
        transform: rotate(-8deg);
        box-shadow: 0 14px 30px rgba(22, 163, 74, 0.65);
    }

    .app-title-text {
        font-size: 1.7rem;
        font-weight: 780;
        letter-spacing: 0.02em;
        background: linear-gradient(120deg, #e5e7eb, #a5b4fc, #38bdf8);
        -webkit-background-clip: text;
        color: transparent;
    }

    .app-subtitle {
        font-size: 0.88rem;
        color: var(--text-soft);
    }

    .search-panel {
        margin-top: 10px;
        margin-bottom: 18px;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
        align-items: flex-start;
    }

    .search-input-wrap { position: relative; z-index: 100; }

    .search-label {
        font-size: 0.82rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-soft);
        margin-bottom: 6px;
    }

    /* ── Search shell: pill by default, flattens bottom when open ── */
    .search-input-shell {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 11px;
        border-radius: 999px;
        background: radial-gradient(circle at 0% 0%, rgba(94, 234, 212, 0.16), transparent 60%),
                    rgba(15, 23, 42, 0.98);
        border: 1px solid rgba(148, 163, 184, 0.55);
        transition: border-radius 0.15s ease, border-color 0.15s ease;
        position: relative;
        z-index: 2;
    }

    /* When dropdown is open: square off the bottom, drop the bottom border */
    .search-input-shell.open {
        border-radius: 18px 18px 0 0;
        border-bottom-color: transparent;
        border-color: var(--accent-strong);
        box-shadow: 1px -1px 0 0 rgba(129, 140, 248, 0.6),
                    -1px -1px 0 0 rgba(129, 140, 248, 0.6);
    }

    .search-input-shell:focus-within:not(.open) {
        border-color: var(--accent-strong);
        box-shadow: 0 0 0 1px rgba(129, 140, 248, 0.6);
    }

    .search-icon { font-size: 1.1rem; opacity: 0.9; }

    .search-input {
        flex: 1;
        font-size: 0.9rem;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-main);
    }

    .search-input::placeholder { color: rgba(148, 163, 184, 0.7); }

    /* ── Suggestions: hidden by default, absolute overlay when open ── */
    .suggestions-container {
        display: none;
        position: absolute;
        top: 100%;                              /* sits right below shell */
        left: 0;
        right: 0;
        margin-top: 0;
        border-radius: 0 0 16px 16px;
        border: 1px solid var(--accent-strong);
        border-top: none;
        background: radial-gradient(circle at top left, var(--accent-soft), transparent 55%),
                    rgba(15, 23, 42, 0.98);
        max-height: 220px;
        overflow: hidden;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6),
                    1px 0 0 0 rgba(129, 140, 248, 0.6),
                    -1px 0 0 0 rgba(129, 140, 248, 0.6);
        z-index: 99;
    }

    .suggestions-container.open {
        display: block;
    }

    .suggestions-list {
        max-height: 220px;
        overflow-y: auto;
    }

    .suggestion-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 7px 10px;
        cursor: pointer;
        font-size: 0.84rem;
        color: var(--text-main);
        border-bottom: 1px solid rgba(15, 23, 42, 0.9);
    }

    .suggestion-item:last-child { border-bottom: none; }

    .suggestion-item:hover { background: rgba(30, 64, 175, 0.45); }

    .suggestion-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .suggestion-meta {
        font-size: 0.75rem;
        color: var(--text-soft);
        white-space: nowrap;
    }

    .main-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 18px;
        margin-top: 4px;
    }

    .panel {
        border-radius: var(--radius-lg);
        background: rgba(15, 23, 42, 0.98);
        border: 1px solid var(--border-subtle);
        padding: 14px 14px 12px;
    }

    .panel-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        gap: 10px;
    }

    .panel-title {
        font-size: 0.92rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-soft);
    }

    .toggle-wrap {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
        color: var(--text-soft);
        white-space: nowrap;
    }

    .toggle-label { font-size: 0.78rem; }

    .switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
    }

    .switch input { opacity: 0; width: 0; height: 0; }

    .slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: #4b5563;
        transition: 0.2s;
        border-radius: 999px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.2s;
        border-radius: 50%;
    }

    input:checked + .slider { background-color: var(--accent-strong); }
    input:checked + .slider:before { transform: translateX(16px); }

    .recs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 16px;
        margin-bottom: 6px;
    }

    .rec-card {
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: rgba(15, 23, 42, 0.97);
        padding: 10px;
        font-size: 0.9rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        will-change: transform;
    }

    .rec-card:hover {
        border-color: var(--accent);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.18);
        transform: translateY(-4px);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .rec-thumb {
        width: 100%;
        height: 100px;
        border-radius: 12px;
        object-fit: cover;
        border: 1px solid rgba(148, 163, 184, 0.5);
        margin-bottom: 4px;
    }

    .rec-title {
        font-weight: 700;
        font-size: 1.02rem;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .rec-meta-row {
        font-size: 0.82rem;
        color: var(--text-soft);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
    }

    .badge-perfect {
        border-color: rgba(34, 197, 94, 0.9);
        background: rgba(34, 197, 94, 0.12);
        color: #bbf7d0;
    }

    .badge-good {
        border-color: rgba(59, 130, 246, 0.9);
        background: rgba(59, 130, 246, 0.12);
        color: #bfdbfe;
    }

    .badge-decent {
        border-color: rgba(234, 179, 8, 0.9);
        background: rgba(234, 179, 8, 0.12);
        color: #facc15;
    }

    .badge-loose {
        border-color: rgba(248, 113, 113, 0.9);
        background: rgba(248, 113, 113, 0.12);
        color: #fecaca;
    }

    .rec-genres {
        font-size: 0.82rem;
        color: var(--text-soft);
        max-height: 54px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
        .app-root { padding: 0; }
        .app-shell {
            padding: 16px;
            border-radius: 0;
            box-shadow: none;
            border-left: 0;
            border-right: 0;
        }
        .recs-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .rec-thumb { height: 140px; }
    }
</style>
</head>

<body>
<div class="app-root">
  <div class="app-shell">

    <!-- HEADER -->
    <div class="app-header">
      <div class="app-title-block">
        <div class="app-title-row">
          <div class="app-logo">A</div>
          <div class="app-title-text">Anime Recommender</div>
        </div>
        <div class="app-subtitle">
          Tag-rank similarity engine. Type a title, pick a show, and explore its closest neighbors.
        </div>
      </div>
    </div>

    <!-- SEARCH BAR -->
    <div class="search-panel">
      <div class="search-input-wrap">
        <div class="search-label">Search anime</div>
        <div class="search-input-shell" id="search-shell">
          <span class="search-icon">🔍</span>
          <input id="search-input" class="search-input" type="text" placeholder="e.g. NARUTO: Shippuuden" />
        </div>

        <div class="suggestions-container" id="suggestions-container">
          <div id="suggestions-list" class="suggestions-list"></div>
        </div>
      </div>
    </div>

    <!-- MAIN LAYOUT -->
    <div class="main-layout">
      <div class="panel">
        <div class="panel-header-row">
          <div>
            <div class="panel-title">Related anime</div>
          </div>

          <!-- ADULT TOGGLE -->
          <div class="toggle-wrap">
            <span class="toggle-label">Include 18+ / adult</span>
            <label class="switch">
              <input type="checkbox" id="adult-toggle" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div id="recs-grid" class="recs-grid"></div>
      </div>
    </div>

  </div>
</div>

<script>
const ANIME_DATA = """ + anime_json + """;
const NEIGHBORS = """ + neighbors_json + """;

const CARD_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200'%3E%3Crect width='600' height='200' fill='%230f172a'/%3E%3Crect x='1' y='1' width='598' height='198' rx='11' ry='11' fill='none' stroke='%23334155' stroke-width='1.5'/%3E%3Ctext x='50%25' y='44%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='28' fill='%23334155'%3E%E2%9C%A6%3C/text%3E%3Ctext x='50%25' y='64%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='12' fill='%23475569' letter-spacing='2'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

function fmtInt(x) {
    if (x === null || x === undefined) return "—";
    if (typeof x !== "number") {
        const num = Number(x);
        if (!Number.isFinite(num)) return String(x);
        x = num;
    }
    return x.toLocaleString("en-US");
}

function similarityLabel(score) {
    if (score === null || score === undefined || isNaN(score)) return "Unknown";
    if (score >= 90) return "Perfect match";
    if (score >= 70) return "Good match";
    if (score >= 50) return "Decent match";
    return "Loose match";
}

function labelClass(label) {
    if (label === "Perfect match") return "badge badge-perfect";
    if (label === "Good match") return "badge badge-good";
    if (label === "Decent match") return "badge badge-decent";
    return "badge badge-loose";
}

const allTitles = Object.keys(ANIME_DATA);

const sortedTitles = allTitles.slice().sort((a, b) => {
    const pa = ANIME_DATA[a].popularity || 0;
    const pb = ANIME_DATA[b].popularity || 0;
    if (pb !== pa) return pb - pa;
    return a.localeCompare(b);
});

const searchInput  = document.getElementById("search-input");
const searchShell  = document.getElementById("search-shell");
const suggestionsContainer = document.getElementById("suggestions-container");
const suggestionsList = document.getElementById("suggestions-list");
const recsGrid     = document.getElementById("recs-grid");
const adultToggle  = document.getElementById("adult-toggle");

let currentTitle = null;
let includeAdult = false;

/* ── Open / close helpers ── */
function openDropdown() {
    searchShell.classList.add("open");
    suggestionsContainer.classList.add("open");
}

function closeDropdown() {
    searchShell.classList.remove("open");
    suggestionsContainer.classList.remove("open");
}

function renderSuggestions() {
    const q = searchInput.value.trim().toLowerCase();
    let candidates;

    if (!q) {
        candidates = sortedTitles.slice(0, 10);
    } else {
        candidates = sortedTitles.filter(t => t.toLowerCase().includes(q)).slice(0, 10);
    }

    suggestionsList.innerHTML = "";

    if (candidates.length === 0) {
        const empty = document.createElement("div");
        empty.className = "suggestion-item";
        empty.textContent = "No matches";
        suggestionsList.appendChild(empty);
        return;
    }

    candidates.forEach(title => {
        const anime = ANIME_DATA[title];
        const pop = anime ? anime.popularity || 0 : 0;

        const row = document.createElement("div");
        row.className = "suggestion-item";

        /* Use mousedown so the click fires before the input loses focus */
        row.addEventListener("mousedown", (e) => {
            e.preventDefault();           // prevent blur before click registers
            searchInput.value = title;
            selectAnime(title);
            closeDropdown();
        });

        const left = document.createElement("div");
        left.className = "suggestion-title";
        left.textContent = title;

        const right = document.createElement("div");
        right.className = "suggestion-meta";

        row.appendChild(left);
        row.appendChild(right);
        suggestionsList.appendChild(row);
    });

    if (!currentTitle && candidates.length > 0) {
        selectAnime(candidates[0]);
    }
}

function selectAnime(title) {
    currentTitle = title;
    renderNeighborsFor(title);
}

function renderNeighborsFor(title) {
    const list = NEIGHBORS[title] || [];
    const enriched = [];

    list.forEach(entry => {
        const recTitle = entry.title;
        const score = entry.score;
        const anime = ANIME_DATA[recTitle];

        if (!anime) return;

        if (!includeAdult) {
            const genresLower = (anime.genres || []).map(g => g.toLowerCase());
            const titleLower = recTitle.toLowerCase();

            if (
                anime.isAdult === true ||
                genresLower.includes("hentai") ||
                titleLower.includes("hentai")
            ) {
                return;
            }
        }

        const genres = (anime.genres || []).join(", ");
        const banner =
            anime.bannerImage ||
            anime.trailer_thumbnail ||
            CARD_PLACEHOLDER;

        const sim = typeof score === "number" ? Math.round(score * 100) / 100 : score;
        const label = similarityLabel(sim);

        enriched.push({
            rank: enriched.length + 1,
            title: recTitle,
            similarity: sim,
            matchLabel: label,
            genres,
            banner,
            siteUrl: anime.siteUrl || null
        });
    });

    recsGrid.innerHTML = "";
    enriched.slice(0, 50).forEach(rec => {
        const card = document.createElement(rec.siteUrl ? "a" : "div");
        card.className = "rec-card";

        if (rec.siteUrl) {
            card.href = rec.siteUrl;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
        }

        const img = document.createElement("img");
        img.className = "rec-thumb";
        img.src = rec.banner;
        img.alt = rec.title;
        img.onerror = () => { img.onerror = null; img.src = CARD_PLACEHOLDER; };
        card.appendChild(img);

        const titleEl = document.createElement("div");
        titleEl.className = "rec-title";
        titleEl.textContent = `#${rec.rank} · ${rec.title}`;
        card.appendChild(titleEl);

        const metaRow = document.createElement("div");
        metaRow.className = "rec-meta-row";

        const badgeSpan = document.createElement("span");
        badgeSpan.className = labelClass(rec.matchLabel);
        badgeSpan.textContent = rec.matchLabel;
        metaRow.appendChild(badgeSpan);

        card.appendChild(metaRow);

        const genresEl = document.createElement("div");
        genresEl.className = "rec-genres";
        genresEl.textContent = rec.genres || "—";
        card.appendChild(genresEl);

        recsGrid.appendChild(card);
    });
}

/* ── Event listeners ── */
searchInput.addEventListener("focus", () => {
    renderSuggestions();
    openDropdown();
});

searchInput.addEventListener("input", () => {
    renderSuggestions();
    openDropdown();
});

/* Close when clicking outside the search wrap */
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-input-wrap")) {
        closeDropdown();
    }
});

adultToggle.addEventListener("change", (e) => {
    includeAdult = e.target.checked;
    if (currentTitle) renderNeighborsFor(currentTitle);
});

/* On load: pre-populate recs with the most popular anime, but keep dropdown closed */
window.addEventListener("load", () => {
    if (sortedTitles.length > 0) {
        selectAnime(sortedTitles[0]);
    }
});
</script>

</body>
</html>
"""

# Keep your existing approach (no logic tampering)
calculate_height = 700 + len(neighbors) / 3

# Make it full-width and allow the page to scroll (so you don't get clipped)
components.html(html_code, height=int(calculate_height), scrolling=True)
