from functools import lru_cache
import re

from pymongo import MongoClient
from pymongo.errors import PyMongoError

DB_NAME = "ANIME_REC"
COLLECTION_NAME = "final_anime"


@lru_cache(maxsize=1)
def get_mongo_client(mongodb_uri: str):
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
    return client[DB_NAME][COLLECTION_NAME]


def _build_search_filter(query: str, include_adult: bool):
    mongo_filter = {}

    if not include_adult:
        mongo_filter["isAdult"] = {"$ne": True}

    query = (query or "").strip()
    if query:
        escaped = re.escape(query)
        regex = {"$regex": escaped, "$options": "i"}

        mongo_filter["$or"] = [
            {"title_romaji": regex},
            {"title_native": regex},
            {"title_userPreferred": regex},
            {"synonyms": regex},
        ]

    return mongo_filter


def search_anime_page(
    mongodb_uri: str,
    query: str = "",
    include_adult: bool = False,
    page: int = 1,
    page_size: int = 24,
):
    try:
        collection = get_anime_collection(mongodb_uri)

        page = max(1, int(page))
        page_size = max(1, min(int(page_size), 100))
        skip = (page - 1) * page_size

        mongo_filter = _build_search_filter(query, include_adult)

        total = collection.count_documents(mongo_filter)

        cursor = (
            collection.find(mongo_filter, {"_id": 0})
            .sort("popularity", -1)
            .skip(skip)
            .limit(page_size)
        )

        results = list(cursor)

        return {
            "items": results,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        }

    except PyMongoError as e:
        raise RuntimeError(f"MongoDB query failed: {e}") from e