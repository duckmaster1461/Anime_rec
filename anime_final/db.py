from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError
import streamlit as st

DB_NAME = "ANIME_REC"
COLLECTION_NAME = "final_anime"
DEFAULT_PAGE_SIZE = 30


@st.cache_resource(show_spinner=False)
def get_mongo_client():
    try:
        mongodb_uri = st.secrets["MONGODB_URI"]
    except Exception as e:
        raise RuntimeError(
            "MONGODB_URI not found in Streamlit secrets. "
            "Make sure it exists in .streamlit/secrets.toml locally "
            "or in Streamlit Cloud App Settings > Secrets."
        ) from e

    mongodb_uri = str(mongodb_uri).strip()
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI is empty in Streamlit secrets.")

    try:
        client = MongoClient(
            mongodb_uri,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=15000,
            retryWrites=True,
            maxPoolSize=20,
            minPoolSize=1,
            appname="AnimeRecommenderStreamlit",
        )
        client.admin.command("ping")
        return client
    except Exception as e:
        raise RuntimeError(f"MongoDB connection failed: {e}") from e


def get_anime_collection():
    client = get_mongo_client()
    return client[DB_NAME][COLLECTION_NAME]


# ---------------------------------------------------------------------------
# Paginated fetch – called on every page load / search / page-switch
# ---------------------------------------------------------------------------

def _build_search_filter(query=None):
    if not query or not query.strip():
        return {}
    q = query.strip()
    return {
        "$or": [
            {"title_romaji": {"$regex": q, "$options": "i"}},
            {"title": {"$regex": q, "$options": "i"}},
        ]
    }


def get_anime_page(page=1, page_size=DEFAULT_PAGE_SIZE, query=None):
    """Return one page of anime sorted by popularity (descending)."""
    collection = get_anime_collection()
    skip = (page - 1) * page_size
    filt = _build_search_filter(query)

    cursor = (
        collection.find(filt, {"_id": 0})
        .sort("popularity", DESCENDING)
        .skip(skip)
        .limit(page_size)
    )

    result = {}
    for anime in cursor:
        title = anime.get("title_romaji") or anime.get("title") or "Untitled"
        result[str(title)] = anime
    return result


def count_anime(query=None):
    """Count documents, optionally filtered by a search query."""
    collection = get_anime_collection()
    filt = _build_search_filter(query)
    if filt:
        return collection.count_documents(filt)
    return collection.estimated_document_count()


# ---------------------------------------------------------------------------
# Bulk title lookup – used to hydrate neighbour cards
# ---------------------------------------------------------------------------

def get_anime_by_titles(titles):
    """Fetch anime docs for a list of titles (used for recommendation cards)."""
    if not titles:
        return {}
    collection = get_anime_collection()
    cursor = collection.find(
        {
            "$or": [
                {"title_romaji": {"$in": titles}},
                {"title": {"$in": titles}},
            ]
        },
        {"_id": 0},
    )
    result = {}
    for anime in cursor:
        title = anime.get("title_romaji") or anime.get("title") or "Untitled"
        result[str(title)] = anime
    return result


# ---------------------------------------------------------------------------
# Full load (cached) – kept as a fast fallback for neighbour metadata
# ---------------------------------------------------------------------------

@st.cache_data(show_spinner=False, ttl=3600)
def load_all_anime_metadata():
    """
    Cache *all* anime metadata for 1 h.
    Used to look up neighbour cards without extra per-request DB round-trips.
    """
    collection = get_anime_collection()
    cursor = collection.find({}, {"_id": 0}).batch_size(1000)

    payload = {}
    for anime in cursor:
        title = anime.get("title_romaji") or anime.get("title") or "Untitled"
        payload[str(title)] = {
            "genres": anime.get("genres") or [],
            "averageScore": anime.get("averageScore"),
            "popularity": anime.get("popularity") or 0,
            "siteUrl": anime.get("siteUrl"),
            "bannerImage": anime.get("bannerImage"),
            "trailer_thumbnail": anime.get("trailer_thumbnail"),
            "isAdult": anime.get("isAdult"),
        }

    if not payload:
        raise RuntimeError(
            f"No data found in {DB_NAME}.{COLLECTION_NAME}. "
            "Check database name, collection name, and imported documents."
        )
    return payload