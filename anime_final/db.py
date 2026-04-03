from pymongo import MongoClient
from pymongo.errors import PyMongoError
import streamlit as st

DB_NAME = "ANIME_REC"
COLLECTION_NAME = "final_anime"


@st.cache_resource(show_spinner=False)
def get_mongo_client():
    """
    Create and reuse a single MongoDB client for the app process.
    This avoids reconnecting on every rerun.
    """
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

        # Validate once when the cached client is created
        client.admin.command("ping")
        return client

    except Exception as e:
        raise RuntimeError(f"MongoDB connection failed: {e}") from e


def get_anime_collection():
    client = get_mongo_client()
    db = client[DB_NAME]
    return db[COLLECTION_NAME]


def load_anime_from_mongodb():
    """
    Load anime data and index by title.
    Uses the cached Mongo client and fails clearly if DB is empty.
    """
    try:
        collection = get_anime_collection()

        anime_by_title = {}

        cursor = collection.find({}, {"_id": 0}).batch_size(1000)

        for anime in cursor:
            title = anime.get("title_romaji") or anime.get("title") or "Untitled"
            anime_by_title[str(title)] = anime

        if not anime_by_title:
            raise RuntimeError(
                f"No data found in {DB_NAME}.{COLLECTION_NAME}. "
                "Check database name, collection name, and imported documents."
            )

        return anime_by_title

    except PyMongoError as e:
        raise RuntimeError(f"MongoDB query failed: {e}") from e
    except Exception:
        raise