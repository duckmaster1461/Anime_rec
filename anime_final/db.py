from pymongo import MongoClient


# Replace this with your real MongoDB Atlas connection string
MONGODB_URI = "mongodb+srv://mehaan1461:DUCK@cluster0.ozgpj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

DB_NAME = "ANIME_REC"
COLLECTION_NAME = "final_anime"

def get_anime_collection():
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    return db[COLLECTION_NAME]


def load_anime_from_mongodb():
    collection = get_anime_collection()

    anime_by_title = {}

    cursor = collection.find({}, {"_id": 0})
    for anime in cursor:
        title = anime.get("title_romaji") or anime.get("title") or "Untitled"
        title = str(title)
        anime_by_title[title] = anime

    return anime_by_title