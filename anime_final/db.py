from pymongo import MongoClient
from pymongo.errors import PyMongoError
import streamlit as st

DB_NAME = "ANIME_REC"
COLLECTION_NAME = "final_anime"


def get_mongo_client():
    """
    Create MongoDB client using Streamlit secrets.
    Works for both local .streamlit/secrets.toml and Streamlit Cloud secrets.
    """
    try:
        mongodb_uri = st.secrets["MONGODB_URI"]
    except Exception as e:
        raise RuntimeError(
            "MONGODB_URI not found in Streamlit secrets. "
            "Make sure it exists in .streamlit/secrets.toml locally "
            "or in Streamlit Cloud App Settings > Secrets."
        ) from e

    if not mongodb_uri or not str(mongodb_uri).strip():
        raise RuntimeError("MONGODB_URI is empty in Streamlit secrets.")

    try:
        client = MongoClient(
            str(mongodb_uri).strip(),
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=15000,
            retryWrites=True,
        )

        # Force connection check immediately
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
    Fails clearly if DB is empty or misconfigured.
    """
    try:
        collection = get_anime_collection()

        anime_by_title = {}

        cursor = collection.find({}, {"_id": 0})

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