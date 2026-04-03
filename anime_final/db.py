from pymongo import MongoClient
from pymongo.errors import PyMongoError
import streamlit as st

DB_NAME = "ANIME_REC"
COLLECTION_NAME = "final_anime"


def get_mongo_client():
    """
    Create MongoDB client using Streamlit secrets.
    """
    try:
        mongodb_uri = st.secrets["MONGODB_URI"]
    except Exception:
        raise RuntimeError(
            "MONGODB_URI not found in Streamlit secrets.\n"
            "Add it in .streamlit/secrets.toml"
        )

    return MongoClient(
        mongodb_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=15000,
        retryWrites=True,
    )


def get_anime_collection():
    client = get_mongo_client()

    try:
        # Force connection check
        client.admin.command("ping")
    except Exception as e:
        raise RuntimeError(f"MongoDB connection failed: {e}")

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
            raise ValueError(
                f"No data found in {DB_NAME}.{COLLECTION_NAME}. "
                "Check database name, collection name, or import."
            )

        return anime_by_title

    except PyMongoError as e:
        raise RuntimeError(f"MongoDB query failed: {e}")