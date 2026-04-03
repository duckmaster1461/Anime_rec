import json
import math
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

from db import get_anime_page, count_anime, load_all_anime_metadata
from webapp_template import HTML_TEMPLATE

BASE_DIR = Path(__file__).resolve().parent
SIM_PATH = BASE_DIR / "anime_similarity_top50_rank.json"
PAGE_SIZE = 30

# ---------------------------------------------------------------------------
# Page config & base CSS
# ---------------------------------------------------------------------------

STREAMLIT_BASE_CSS = """
<style>
.block-container{
    padding-top: 1rem !important;
    padding-bottom: 0rem !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
    max-width: 100% !important;
}

header[data-testid="stHeader"]{
    visibility: hidden !important;
}

div[data-testid="stToolbar"]{
    visibility: hidden !important;
}

div[data-testid="stStatusWidget"]{
    visibility: hidden !important;
}

div[data-testid="stDecoration"]{
    visibility: hidden !important;
}

#MainMenu{
    visibility: hidden !important;
}

footer{
    visibility: hidden !important;
}

html, body, .stApp{
    background: #050816 !important;
}

iframe[title="streamlit.components.v1.html"]{
    width: 100% !important;
    border: 0 !important;
    display: block !important;
}

/* style the search input and pagination to match the dark theme */
[data-testid="stTextInput"] label {
    color: #9ca3af !important;
}
[data-testid="stTextInput"] input {
    background: rgba(15, 23, 42, 0.95) !important;
    color: #e5e7eb !important;
    border-color: rgba(148, 163, 184, 0.4) !important;
    border-radius: 12px !important;
}
[data-testid="stTextInput"] input::placeholder {
    color: rgba(148, 163, 184, 0.6) !important;
}

/* pagination buttons */
.stButton > button {
    background: rgba(99, 102, 241, 0.15) !important;
    color: #e5e7eb !important;
    border: 1px solid rgba(99, 102, 241, 0.5) !important;
    border-radius: 999px !important;
}
.stButton > button:hover {
    background: rgba(99, 102, 241, 0.35) !important;
}
.stButton > button:disabled {
    opacity: 0.35 !important;
}

/* page counter caption */
[data-testid="stCaptionContainer"] {
    text-align: center;
}
[data-testid="stCaptionContainer"] p {
    color: #9ca3af !important;
}
</style>
"""

st.set_page_config(
    page_title="Anime Recommender – Tag Rank Similarity",
    layout="wide",
)

st.markdown(STREAMLIT_BASE_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

if "page" not in st.session_state:
    st.session_state.page = 1
if "search_query" not in st.session_state:
    st.session_state.search_query = ""

# ---------------------------------------------------------------------------
# Cached loaders
# ---------------------------------------------------------------------------

@st.cache_data(show_spinner=False, ttl=3600)
def load_similarity_data():
    if not SIM_PATH.exists():
        raise FileNotFoundError(f"Similarity file not found at: {SIM_PATH}")
    with SIM_PATH.open("r", encoding="utf-8") as f:
        sim_data = json.load(f)
    if not isinstance(sim_data, dict):
        raise ValueError("Similarity JSON must be a top-level object.")
    neighbors = sim_data.get("neighbors", {})
    if not neighbors:
        raise ValueError("Similarity JSON 'neighbors' is empty.")
    return neighbors

# ---------------------------------------------------------------------------
# Search bar  (submits on Enter – does NOT fire on every keystroke)
# ---------------------------------------------------------------------------

query = st.text_input(
    "🔍  Search anime by title",
    value=st.session_state.search_query,
    placeholder="e.g. NARUTO, Steins;Gate, Attack on Titan …",
)

if query != st.session_state.search_query:
    st.session_state.search_query = query
    st.session_state.page = 1          # reset to first page on new search

# ---------------------------------------------------------------------------
# Fetch current page from MongoDB
# ---------------------------------------------------------------------------

search_q = st.session_state.search_query.strip() or None

try:
    total = count_anime(search_q)
except Exception as e:
    st.error(f"Database error while counting: {e}")
    st.stop()

total_pages = max(1, math.ceil(total / PAGE_SIZE))
page = min(st.session_state.page, total_pages)

try:
    anime_page_raw = get_anime_page(page=page, page_size=PAGE_SIZE, query=search_q)
except Exception as e:
    st.error(f"Database error while fetching page: {e}")
    st.stop()

# Preserve the popularity-sorted order returned by MongoDB
browse_titles = sorted(
    anime_page_raw.keys(),
    key=lambda t: anime_page_raw[t].get("popularity", 0),
    reverse=True,
)

# ---------------------------------------------------------------------------
# Build the payloads to inject into the HTML template
# ---------------------------------------------------------------------------

def _anime_to_payload(anime):
    return {
        "genres": anime.get("genres") or [],
        "averageScore": anime.get("averageScore"),
        "popularity": anime.get("popularity") or 0,
        "siteUrl": anime.get("siteUrl"),
        "bannerImage": anime.get("bannerImage"),
        "trailer_thumbnail": anime.get("trailer_thumbnail"),
        "isAdult": anime.get("isAdult"),
    }


try:
    neighbors_all = load_similarity_data()
    all_metadata   = load_all_anime_metadata()      # cached full set
except Exception as e:
    st.error(f"Failed to load supporting data: {e}")
    st.stop()

# Start with current-page anime
anime_payload = {t: _anime_to_payload(anime_page_raw[t]) for t in browse_titles}

# Gather neighbours for every title on this page
page_neighbors = {}
neighbor_titles_needed = set()

for title in browse_titles:
    if title in neighbors_all:
        page_neighbors[title] = neighbors_all[title]
        for entry in neighbors_all[title]:
            if isinstance(entry, dict):
                nt = entry.get("title", "")
                if nt:
                    neighbor_titles_needed.add(nt)

# Add neighbour metadata (from the cached full set) so rec cards can render
for nt in neighbor_titles_needed:
    if nt not in anime_payload and nt in all_metadata:
        anime_payload[nt] = all_metadata[nt]

# ---------------------------------------------------------------------------
# Build & render the HTML component
# ---------------------------------------------------------------------------

def build_html(anime_payload, neighbors, browse_titles):
    for placeholder in ("__ANIME_JSON__", "__NEIGHBORS_JSON__", "__BROWSE_JSON__"):
        if placeholder not in HTML_TEMPLATE:
            raise ValueError(f"HTML template missing placeholder: {placeholder}")
    return (
        HTML_TEMPLATE
        .replace("__ANIME_JSON__", json.dumps(anime_payload, ensure_ascii=False))
        .replace("__NEIGHBORS_JSON__", json.dumps(neighbors, ensure_ascii=False))
        .replace("__BROWSE_JSON__", json.dumps(browse_titles, ensure_ascii=False))
    )


try:
    html_code = build_html(anime_payload, page_neighbors, browse_titles)
except Exception as e:
    st.error(f"Failed to build page: {e}")
    st.stop()

# Dynamic height: at least 700px, grows with card count
est_rows = math.ceil(len(browse_titles) / 4) if browse_titles else 1
component_height = max(700, 180 + est_rows * 200)

components.html(html_code, height=component_height, scrolling=True)

# ---------------------------------------------------------------------------
# Pagination controls
# ---------------------------------------------------------------------------

col_prev, col_info, col_next = st.columns([1, 2, 1])

with col_prev:
    if st.button("← Previous", disabled=(page <= 1), use_container_width=True):
        st.session_state.page = page - 1
        st.rerun()

with col_info:
    st.caption(f"Page {page} of {total_pages}  ·  {total:,} anime found")

with col_next:
    if st.button("Next →", disabled=(page >= total_pages), use_container_width=True):
        st.session_state.page = page + 1
        st.rerun()