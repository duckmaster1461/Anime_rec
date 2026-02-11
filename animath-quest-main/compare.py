import json
import pandas as pd
import time

with open("ANIME_REC.json", "r", encoding="utf-8") as f:
    data = json.load(f)

def has_non_empty_tags(anime: dict) -> bool:
    tags = anime.get("tags", [])
    return isinstance(tags, list) and len(tags) > 2

data_no_empty_tags = [anime for anime in data if has_non_empty_tags(anime)]

removed_count = len(data) - len(data_no_empty_tags)
print(f"Anime with empty or missing tags[] removed: {removed_count}")
print(f"Anime remaining after removing empty tags[]: {len(data_no_empty_tags)}")
print()

data = data_no_empty_tags

rows = []

for anime in data:
    title = anime.get("title_romaji") or anime.get("title") or "Untitled"
    tags = anime.get("tags", [])
    tag_list = []

    for tag in tags:
        tag_list.append({
            "name": tag.get("name"),
            "rank": tag.get("rank")
        })

    rows.append({
        "title_romaji": title,
        "tags_with_rank": json.dumps(tag_list, ensure_ascii=False)
    })


df = pd.DataFrame(rows)

def compare_anime_tags(row1, row2):
    tags1 = json.loads(row1["tags_with_rank"])
    tags2 = json.loads(row2["tags_with_rank"])

    tag_dict1 = {tag["name"]: tag["rank"] for tag in tags1}
    tag_dict2 = {tag["name"]: tag["rank"] for tag in tags2}

    all_tags = set(tag_dict1.keys()).union(set(tag_dict2.keys()))
    differences = []

    for tag in all_tags:
        rank1 = tag_dict1.get(tag)
        rank2 = tag_dict2.get(tag)
        if rank1 != rank2:
            differences.append((tag, rank1, rank2))

    return differences

for i in range(len(df)):
    for j in range(i + 1, len(df)):
        total = 0
        count = 0
        row1 = df.iloc[i]
        row2 = df.iloc[j]
        diffs = compare_anime_tags(row1, row2)
        if diffs:
            for tag, rank1, rank2 in diffs:
                count += 1
                if rank1 is None:
                    rank1 = 0
                if rank2 is None:
                    rank2 = 0
                total += 1 - abs(rank1 - rank2)/100
        if total/count > 0.87: 
            print(f"Differences between '{row1['title_romaji']}' and '{row2['title_romaji']}': ",total/count)
            print()
