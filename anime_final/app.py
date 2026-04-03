import json
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

from db import load_anime_from_mongodb
from webapp_template import HTML_TEMPLATE

SIM_PATH = Path("anime_similarity_top50_rank.json")

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


st.set_page_config(
    page_title="Anime Recommender – Tag Rank Similarity",
    layout="wide",
)

st.markdown(STREAMLIT_BASE_CSS, unsafe_allow_html=True)


@st.cache_data(show_spinner=False)
def load_similarity_data():
    with SIM_PATH.open("r", encoding="utf-8") as f:
        sim_data = json.load(f)

    neighbors = sim_data.get("neighbors", {})
    meta = sim_data.get("meta", {})
    return neighbors, meta


@st.cache_data(show_spinner=False)
def build_anime_payload():
    anime_by_title = load_anime_from_mongodb()

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

    return anime_payload


def build_html(anime_payload, neighbors):
    return (
        HTML_TEMPLATE
        .replace("__ANIME_JSON__", json.dumps(anime_payload, ensure_ascii=False))
        .replace("__NEIGHBORS_JSON__", json.dumps(neighbors, ensure_ascii=False))
    )


def main():
    try:
        anime_payload = build_anime_payload()
        neighbors, _meta = load_similarity_data()
        html_code = build_html(anime_payload, neighbors)
    except Exception as e:
        st.error(f"Failed to load app data: {e}")
        st.stop()

    calculate_height = 700 + len(neighbors) / 3
    components.html(html_code, height=int(calculate_height), scrolling=True)


if __name__ == "__main__":
    main()