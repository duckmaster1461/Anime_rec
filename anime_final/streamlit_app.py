import json
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

from db import load_anime_from_mongodb
from webapp_template import HTML_TEMPLATE

BASE_DIR = Path(__file__).resolve().parent
SIM_PATH = BASE_DIR / "anime_similarity_top50_rank.json"

STREAMLIT_BASE_CSS = """
<style>
.block-container{
    padding-top: 0rem !important;
    padding-bottom: 0rem !important;
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
}

iframe[title="streamlit.components.v1.html"]{
    width: 100% !important;
    border: 0 !important;
    display: block !important;
}
</style>
"""


def get_mongodb_uri():
    try:
        mongodb_uri = st.secrets["MONGODB_URI"]
    except Exception as e:
        raise RuntimeError(
            "MONGODB_URI not found in Streamlit secrets. "
            "Add it in .streamlit/secrets.toml locally or in Streamlit Cloud Secrets."
        ) from e

    mongodb_uri = str(mongodb_uri).strip()
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI is empty in Streamlit secrets.")

    return mongodb_uri


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
        raise ValueError("Similarity JSON field 'neighbors' must be an object.")

    if not neighbors:
        raise ValueError("Similarity JSON loaded but 'neighbors' is empty.")

    return neighbors, meta


@st.cache_data(show_spinner=False, ttl=3600)
def build_anime_payload(mongodb_uri: str):
    anime_by_title = load_anime_from_mongodb(mongodb_uri)

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

    if not anime_payload:
        raise ValueError("MongoDB returned zero anime records.")

    return anime_payload


def build_html(anime_payload, neighbors):
    if "__ANIME_JSON__" not in HTML_TEMPLATE or "__NEIGHBORS_JSON__" not in HTML_TEMPLATE:
        raise ValueError("HTML template placeholders are missing.")

    return (
        HTML_TEMPLATE
        .replace("__ANIME_JSON__", json.dumps(anime_payload, ensure_ascii=False))
        .replace("__NEIGHBORS_JSON__", json.dumps(neighbors, ensure_ascii=False))
    )


def main():
    st.set_page_config(
        page_title="Anime Recommender – Tag Rank Similarity",
        layout="wide",
    )

    st.markdown(STREAMLIT_BASE_CSS, unsafe_allow_html=True)

    try:
        mongodb_uri = get_mongodb_uri()
        anime_payload = build_anime_payload(mongodb_uri)
        neighbors, _meta = load_similarity_data()
        html_code = build_html(anime_payload, neighbors)
    except Exception as e:
        st.error(f"Failed to load app data: {e}")
        st.stop()

    calculate_height = 700 + len(neighbors) / 3
    components.html(html_code, height=int(calculate_height), scrolling=True)


if __name__ == "__main__":
    main()