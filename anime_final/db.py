from functools import lru_cache

from pymongo import MongoClient
from pymongo.errors import PyMongoError

DB_NAME = "ANIME_REC"
COLLECTION_NAME = "final_anime"


@lru_cache(maxsize=1)
def get_mongo_client(mongodb_uri: str):
    """
    Create and reuse a single MongoDB client.
    Pure Python: no Streamlit dependency here.
    """
    mongodb_uri = str(mongodb_uri).strip()
    if not mongodb_uri:
        raise RuntimeError("MongoDB URI is empty.")

    try:
        return MongoClient(
            mongodb_uri,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=15000,
            retryWrites=True,
            maxPoolSize=20,
            minPoolSize=1,
            appname="AnimeRecommenderStreamlit",
        )
    except Exception as e:
        raise RuntimeError(f"MongoDB client initialization failed: {e}") from e


def get_anime_collection(mongodb_uri: str):
    client = get_mongo_client(mongodb_uri)
    db = client[DB_NAME]
    return db[COLLECTION_NAME]


def load_anime_from_mongodb(mongodb_uri: str):
    """
    Load anime data and index by title.
    No Streamlit objects used here.
    """
    try:
        collection = get_anime_collection(mongodb_uri)

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