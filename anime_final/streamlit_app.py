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
# Page config & CSS
# ---------------------------------------------------------------------------
#
# KEY IDEA: style Streamlit's own .block-container as the dark rounded shell.
# That way the header (st.markdown), search bar (st.text_input), pagination
# (st.button), and the grid iframe ALL live inside the same visual box —
# no fragile open/close div hacks needed.
# ---------------------------------------------------------------------------

STREAMLIT_BASE_CSS = """
<style>
/* ---- hide chrome ---- */
header[data-testid="stHeader"]{ visibility: hidden !important; }
div[data-testid="stToolbar"]{ visibility: hidden !important; }
div[data-testid="stStatusWidget"]{ visibility: hidden !important; }
div[data-testid="stDecoration"]{ visibility: hidden !important; }
#MainMenu{ visibility: hidden !important; }
footer{ visibility: hidden !important; }

/* ---- page background with gradient ---- */
html, body, .stApp{
    background: #050816 !important;
    color: #e5e7eb !important;
}

[data-testid="stAppViewContainer"]{
    background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.10), transparent 55%),
        radial-gradient(circle at top right, rgba(129, 140, 248, 0.14), transparent 60%),
        #050816 !important;
}

/* ---- .block-container IS the dark shell ---- */
.block-container{
    max-width: calc(100% - 48px) !important;
    margin: 24px auto !important;
    padding: 24px 26px 26px !important;
    background: rgba(15, 23, 42, 0.92) !important;
    border: 1px solid rgba(148, 163, 184, 0.30) !important;
    border-radius: 22px !important;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.75) !important;
    backdrop-filter: blur(26px) !important;
}

/* ---- header ---- */
.app-header{
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 18px;
}

.app-logo{
    width: 38px; height: 38px;
    border-radius: 12px;
    background: conic-gradient(from 160deg, #22c55e, #22c55e, #22d3ee, #6366f1, #22c55e);
    display: flex; align-items: center; justify-content: center;
    color: #0b1120; font-size: 22px; font-weight: 800;
    transform: rotate(-8deg);
    box-shadow: 0 14px 30px rgba(22, 163, 74, 0.65);
    flex-shrink: 0;
}

.app-title-text{
    font-size: 1.7rem; font-weight: 780; letter-spacing: 0.02em;
    background: linear-gradient(120deg, #e5e7eb, #a5b4fc, #38bdf8);
    -webkit-background-clip: text; color: transparent;
}

.app-subtitle{
    font-size: 0.88rem; color: #9ca3af; margin-top: 4px;
}

/* ---- search input ---- */
div[data-testid="stTextInput"] input{
    background: rgba(15, 23, 42, 0.98) !important;
    color: #e5e7eb !important;
    border-radius: 999px !important;
    border: 1px solid rgba(148, 163, 184, 0.55) !important;
    font-size: 0.9rem !important;
    padding: 0.5rem 1rem !important;
}
div[data-testid="stTextInput"] input::placeholder{
    color: rgba(148, 163, 184, 0.6) !important;
}
div[data-testid="stTextInput"] input:focus{
    border-color: #4f46e5 !important;
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.5) !important;
}
div[data-testid="stTextInput"] label{
    color: #9ca3af !important;
    font-size: 0.82rem !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
}

/* ---- buttons ---- */
div.stButton > button{
    background: rgba(99, 102, 241, 0.15) !important;
    color: #e5e7eb !important;
    border: 1px solid rgba(99, 102, 241, 0.45) !important;
    border-radius: 999px !important;
    font-size: 0.85rem !important;
}
div.stButton > button:hover{
    background: rgba(99, 102, 241, 0.35) !important;
}
div.stButton > button:disabled{
    opacity: 0.3 !important;
}

/* ---- caption ---- */
[data-testid="stCaptionContainer"] p{
    color: #9ca3af !important;
    text-align: center !important;
}

/* ---- iframe seamless inside the shell ---- */
iframe[title="streamlit.components.v1.html"]{
    width: 100% !important;
    border: 0 !important;
    display: block !important;
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
    meta = sim_data.get("meta", {})
    if not isinstance(neighbors, dict):
        raise ValueError("'neighbors' must be an object.")
    if not neighbors:
        raise ValueError("'neighbors' is empty.")
    return neighbors, meta


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_payload(anime):
    return {
        "genres": anime.get("genres") or [],
        "averageScore": anime.get("averageScore"),
        "popularity": anime.get("popularity") or 0,
        "siteUrl": anime.get("siteUrl"),
        "bannerImage": anime.get("bannerImage"),
        "trailer_thumbnail": anime.get("trailer_thumbnail"),
        "isAdult": anime.get("isAdult"),
    }

def _go_prev():
    st.session_state.page = max(1, st.session_state.page - 1)

def _go_next():
    st.session_state.page += 1

def _on_search_change():
    st.session_state.search_query = st.session_state._search_widget
    st.session_state.page = 1


def build_html(anime_payload, neighbors, browse_titles):
    for ph in ("__ANIME_JSON__", "__NEIGHBORS_JSON__", "__BROWSE_JSON__"):
        if ph not in HTML_TEMPLATE:
            raise ValueError(f"HTML template missing placeholder: {ph}")
    return (
        HTML_TEMPLATE
        .replace("__ANIME_JSON__", json.dumps(anime_payload, ensure_ascii=False))
        .replace("__NEIGHBORS_JSON__", json.dumps(neighbors, ensure_ascii=False))
        .replace("__BROWSE_JSON__", json.dumps(browse_titles, ensure_ascii=False))
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # ---- header (rendered as HTML inside the block-container shell) ----
    st.markdown(
        """
        <div class="app-header">
            <div class="app-logo">A</div>
            <div>
                <div class="app-title-text">Anime Recommender</div>
                <div class="app-subtitle">
                    Tag-rank similarity engine &mdash; browse anime or click a title to explore its closest neighbours.
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ---- search bar ----
    st.text_input(
        "Search anime by title",
        value=st.session_state.search_query,
        key="_search_widget",
        on_change=_on_search_change,
        placeholder="e.g. NARUTO, Steins;Gate, Attack on Titan …",
    )

    # ---- resolve page / count ----
    search_q = st.session_state.search_query.strip() or None

    try:
        total = count_anime(search_q)
    except Exception as e:
        st.error(f"Database error: {e}")
        st.stop()

    total_pages = max(1, math.ceil(total / PAGE_SIZE))
    if st.session_state.page > total_pages:
        st.session_state.page = total_pages
    page = st.session_state.page

    # ---- pagination row ----
    col_prev, col_info, col_next = st.columns([1, 3, 1])
    with col_prev:
        st.button("← Prev", on_click=_go_prev, disabled=(page <= 1),
                  use_container_width=True)
    with col_info:
        st.caption(f"Page {page} / {total_pages}  ·  {total:,} anime")
    with col_next:
        st.button("Next →", on_click=_go_next, disabled=(page >= total_pages),
                  use_container_width=True)

    # ---- fetch current page from MongoDB ----
    try:
        anime_page_raw = get_anime_page(page=page, page_size=PAGE_SIZE, query=search_q)
    except Exception as e:
        st.error(f"Failed to load anime page: {e}")
        st.stop()

    browse_titles = sorted(
        anime_page_raw.keys(),
        key=lambda t: anime_page_raw[t].get("popularity", 0),
        reverse=True,
    )

    anime_payload = {t: _to_payload(anime_page_raw[t]) for t in browse_titles}

    # ---- attach neighbours + their metadata ----
    try:
        neighbors_all, _meta = load_similarity_data()
        all_metadata = load_all_anime_metadata()
    except Exception as e:
        st.error(f"Failed to load supporting data: {e}")
        st.stop()

    page_neighbors = {}
    for title in browse_titles:
        if title in neighbors_all:
            page_neighbors[title] = neighbors_all[title]
            for entry in neighbors_all[title]:
                nt = entry.get("title", "") if isinstance(entry, dict) else ""
                if nt and nt not in anime_payload and nt in all_metadata:
                    anime_payload[nt] = all_metadata[nt]

    # ---- render the HTML component (grid + detail view) ----
    try:
        html_code = build_html(anime_payload, page_neighbors, browse_titles)
    except Exception as e:
        st.error(f"Failed to build page: {e}")
        st.stop()

    est_rows = math.ceil(max(len(browse_titles), 1) / 4)
    component_height = max(700, 220 + est_rows * 200)
    components.html(html_code, height=int(component_height), scrolling=True)


if __name__ == "__main__":
    main()
