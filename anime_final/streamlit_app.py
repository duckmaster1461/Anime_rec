from math import ceil
import streamlit as st

from db import search_anime_page

PAGE_SIZE = 24

BASE_CSS = """
<style>
.block-container{
    padding-top: 0rem !important;
    padding-bottom: 1rem !important;
    padding-left: 0rem !important;
    padding-right: 0rem !important;
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
    color: #e5e7eb !important;
}

[data-testid="stAppViewContainer"]{
    background: #050816 !important;
}

.hero-wrap{
    min-height: 100vh;
    width: 100%;
    padding: 24px;
    background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.10), transparent 55%),
        radial-gradient(circle at top right, rgba(129, 140, 248, 0.14), transparent 60%),
        #050816;
}

.hero-shell{
    width: 100%;
    border-radius: 22px;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.30);
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.75);
    padding: 24px 26px 26px;
    backdrop-filter: blur(26px);
}

.app-header{
    display:flex;
    align-items:center;
    gap:16px;
    margin-bottom: 18px;
}

.app-logo{
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: conic-gradient(from 160deg, #22c55e, #22c55e, #22d3ee, #6366f1, #22c55e);
    display:flex;
    align-items:center;
    justify-content:center;
    color:#0b1120;
    font-size:22px;
    font-weight:800;
    transform: rotate(-8deg);
    box-shadow: 0 14px 30px rgba(22, 163, 74, 0.65);
}

.app-title-text{
    font-size: 1.7rem;
    font-weight: 780;
    letter-spacing: 0.02em;
    background: linear-gradient(120deg, #e5e7eb, #a5b4fc, #38bdf8);
    -webkit-background-clip: text;
    color: transparent;
}

.app-subtitle{
    font-size: 0.88rem;
    color: #9ca3af;
    margin-top: 4px;
}

.panel{
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.25);
    padding: 14px 14px 12px;
    margin-top: 18px;
}

.panel-title{
    font-size: 0.92rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9ca3af;
    margin-bottom: 10px;
}

.result-card{
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: rgba(15, 23, 42, 0.97);
    padding: 10px;
    height: 100%;
}

.result-thumb{
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.5);
    margin-bottom: 8px;
}

.result-title{
    font-weight: 700;
    font-size: 1rem;
    line-height: 1.25;
    color: #e5e7eb;
    margin-bottom: 6px;
}

.result-meta{
    font-size: 0.82rem;
    color: #9ca3af;
    margin-bottom: 6px;
}

.result-genres{
    font-size: 0.82rem;
    color: #9ca3af;
}

.empty-state{
    color: #9ca3af;
    font-size: 0.95rem;
    padding: 14px 4px;
}

div[data-testid="stTextInput"] input{
    background: rgba(15, 23, 42, 0.98) !important;
    color: #e5e7eb !important;
    border-radius: 999px !important;
    border: 1px solid rgba(148, 163, 184, 0.55) !important;
}

div[data-testid="stCheckbox"] label,
div[data-testid="stMarkdownContainer"],
div[data-testid="stCaptionContainer"]{
    color: #e5e7eb !important;
}

div.stButton > button{
    border-radius: 999px !important;
}
</style>
"""

CARD_PLACEHOLDER = (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200' "
    "viewBox='0 0 600 200'%3E%3Crect width='600' height='200' fill='%230f172a'/%3E"
    "%3Crect x='1' y='1' width='598' height='198' rx='11' ry='11' fill='none' "
    "stroke='%23334155' stroke-width='1.5'/%3E%3Ctext x='50%25' y='44%25' "
    "dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' "
    "font-size='28' fill='%23334155'%3E%E2%9C%A6%3C/text%3E%3Ctext x='50%25' y='64%25' "
    "dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' "
    "font-size='12' fill='%23475569' letter-spacing='2'%3ENO IMAGE%3C/text%3E%3C/svg%3E"
)


def get_mongodb_uri():
    try:
        mongodb_uri = st.secrets["MONGODB_URI"]
    except Exception as e:
        raise RuntimeError(
            "MONGODB_URI not found in Streamlit secrets. "
            "Add it in .streamlit/secrets.toml locally or in Streamlit Cloud secrets."
        ) from e

    mongodb_uri = str(mongodb_uri).strip()
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI is empty in Streamlit secrets.")

    return mongodb_uri


def init_state():
    defaults = {
        "submitted_query": "",
        "search_input": "",
        "include_adult": False,
        "page": 1,
        "searched_once": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def submit_search():
    st.session_state.submitted_query = st.session_state.search_input.strip()
    st.session_state.page = 1
    st.session_state.searched_once = True


def toggle_adult():
    st.session_state.page = 1
    if st.session_state.searched_once:
        st.session_state.searched_once = True


def go_prev():
    st.session_state.page = max(1, st.session_state.page - 1)
    st.session_state.searched_once = True


def go_next(total_pages: int):
    st.session_state.page = min(total_pages, st.session_state.page + 1)
    st.session_state.searched_once = True


def render_result_card(anime: dict):
    title = (
        anime.get("title_romaji")
        or anime.get("title_userPreferred")
        or anime.get("title_native")
        or "Untitled"
    )
    banner = anime.get("bannerImage") or anime.get("trailer_thumbnail") or CARD_PLACEHOLDER
    genres = ", ".join(anime.get("genres") or [])
    score = anime.get("averageScore")
    popularity = anime.get("popularity") or 0
    site_url = anime.get("siteUrl")

    if site_url:
        st.markdown(
            f"""
            <div class="result-card">
                <a href="{site_url}" target="_blank" style="text-decoration:none;color:inherit;">
                    <img class="result-thumb" src="{banner}" onerror="this.src='{CARD_PLACEHOLDER}'" />
                    <div class="result-title">{title}</div>
                    <div class="result-meta">Score: {score if score is not None else "—"} · Popularity: {popularity}</div>
                    <div class="result-genres">{genres if genres else "—"}</div>
                </a>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            f"""
            <div class="result-card">
                <img class="result-thumb" src="{banner}" onerror="this.src='{CARD_PLACEHOLDER}'" />
                <div class="result-title">{title}</div>
                <div class="result-meta">Score: {score if score is not None else "—"} · Popularity: {popularity}</div>
                <div class="result-genres">{genres if genres else "—"}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def main():
    st.set_page_config(
        page_title="Anime Recommender – Search",
        layout="wide",
    )
    st.markdown(BASE_CSS, unsafe_allow_html=True)
    init_state()

    st.markdown('<div class="hero-wrap"><div class="hero-shell">', unsafe_allow_html=True)
    st.markdown(
        """
        <div class="app-header">
            <div class="app-logo">A</div>
            <div>
                <div class="app-title-text">Anime Recommender</div>
                <div class="app-subtitle">
                    Search anime from MongoDB. The database is only queried after a search or page change.
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    left, right = st.columns([5, 1])
    with left:
        st.text_input(
            "Search anime",
            key="search_input",
            placeholder="e.g. Naruto, Bleach, One Piece",
            label_visibility="collapsed",
            on_change=submit_search,
        )
    with right:
        st.checkbox(
            "18+",
            key="include_adult",
            on_change=toggle_adult,
        )

    search_col, clear_col = st.columns([1, 1])
    with search_col:
        st.button("Search", use_container_width=True, on_click=submit_search)
    with clear_col:
        if st.button("Clear", use_container_width=True):
            st.session_state.search_input = ""
            st.session_state.submitted_query = ""
            st.session_state.include_adult = False
            st.session_state.page = 1
            st.session_state.searched_once = False
            st.rerun()

    st.markdown('<div class="panel">', unsafe_allow_html=True)
    st.markdown('<div class="panel-title">Results</div>', unsafe_allow_html=True)

    if not st.session_state.searched_once:
        st.markdown(
            '<div class="empty-state">Page shell loaded. No database query has run yet. Search to load results.</div>',
            unsafe_allow_html=True,
        )
        st.markdown("</div></div></div>", unsafe_allow_html=True)
        return

    try:
        mongodb_uri = get_mongodb_uri()
        result = search_anime_page(
            mongodb_uri=mongodb_uri,
            query=st.session_state.submitted_query,
            include_adult=st.session_state.include_adult,
            page=st.session_state.page,
            page_size=PAGE_SIZE,
        )
    except Exception as e:
        st.error(f"Failed to load search results: {e}")
        st.markdown("</div></div></div>", unsafe_allow_html=True)
        return

    items = result["items"]
    total = result["total"]
    page = result["page"]
    total_pages = result["total_pages"]

    st.caption(
        f'{total} result(s) · page {page} of {total_pages}'
        + (f' · query: "{st.session_state.submitted_query}"' if st.session_state.submitted_query else "")
    )

    if not items:
        st.markdown(
            '<div class="empty-state">No anime matched your search.</div>',
            unsafe_allow_html=True,
        )
    else:
        cols_per_row = 3
        for row_start in range(0, len(items), cols_per_row):
            cols = st.columns(cols_per_row)
            row_items = items[row_start:row_start + cols_per_row]
            for col, anime in zip(cols, row_items):
                with col:
                    render_result_card(anime)

    prev_col, mid_col, next_col = st.columns([1, 2, 1])
    with prev_col:
        st.button(
            "Previous",
            use_container_width=True,
            disabled=(page <= 1),
            on_click=go_prev,
        )
    with mid_col:
        st.markdown(
            f"<div style='text-align:center;color:#9ca3af;padding-top:0.6rem;'>Page {page} / {total_pages}</div>",
            unsafe_allow_html=True,
        )
    with next_col:
        st.button(
            "Next",
            use_container_width=True,
            disabled=(page >= total_pages),
            on_click=go_next,
            args=(total_pages,),
        )

    st.markdown("</div></div></div>", unsafe_allow_html=True)


if __name__ == "__main__":
    main()