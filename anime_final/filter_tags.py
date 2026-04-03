import json
from pathlib import Path
from collections import defaultdict
import pandas as pd


# ==========================
# PATHS
# ==========================
BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "ANIME_REC.json"
OUTPUT_FILE = BASE_DIR / "ANIME_REC_FILTERED.json"


# ==========================
# LOAD JSON
# ==========================
def load_anime_json(file_path: Path):
    if not file_path.exists():
        raise FileNotFoundError(
            f"Input file not found: {file_path}\n"
            f"Make sure ANIME_REC.json is in the same folder."
        )

    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Expected JSON array.")

    return data


# ==========================
# FILTER HELPERS
# ==========================
def has_valid_tag_count(anime: dict) -> bool:
    tags = anime.get("tags", [])
    return isinstance(tags, list) and len(tags) >= 2  # ✅ keep only 2+ tags


def has_ranked_tag(anime: dict) -> bool:
    tags = anime.get("tags", [])
    if not isinstance(tags, list):
        return False

    for tag in tags:
        if not isinstance(tag, dict):
            continue
        if isinstance(tag.get("rank"), int):
            return True

    return False


def extract_clean_tags(anime: dict):
    tags = anime.get("tags", [])
    if not isinstance(tags, list):
        return []

    clean = []
    for tag in tags:
        if not isinstance(tag, dict):
            continue

        name = tag.get("name")
        rank = tag.get("rank")

        if name is None:
            continue

        clean.append({
            "name": name,
            "rank": rank if isinstance(rank, int) else None
        })

    return clean


# ==========================
# FILTER + SAVE FUNCTION
# ==========================
def filter_anime_and_save(
    input_file: Path = INPUT_FILE,
    output_file: Path = OUTPUT_FILE,
    require_ranked_tag: bool = False
):
    data = load_anime_json(input_file)

    print(f"Total anime loaded: {len(data)}")

    # Remove 0 or 1 tag anime
    before = len(data)
    filtered = [anime for anime in data if has_valid_tag_count(anime)]
    removed = before - len(filtered)

    print(f"Removed anime with < 2 tags: {removed}")
    print(f"Remaining after tag filter: {len(filtered)}")

    # Optional ranked filter
    if require_ranked_tag:
        before_rank = len(filtered)
        filtered = [anime for anime in filtered if has_ranked_tag(anime)]
        removed_rank = before_rank - len(filtered)

        print(f"Removed anime without ranked tags: {removed_rank}")
        print(f"Remaining after ranked filter: {len(filtered)}")

    # Save
    with output_file.open("w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)

    print(f"Saved filtered file to: {output_file}")

    return filtered


# ==========================
# TAG RANK AGGREGATION
# ==========================
def aggregate_tag_ranks(data):
    tag_ranks = defaultdict(list)

    for anime in data:
        tags = anime.get("tags", [])
        if not isinstance(tags, list):
            continue

        for tag in tags:
            if not isinstance(tag, dict):
                continue

            name = tag.get("name")
            rank = tag.get("rank")

            if name and isinstance(rank, int):
                tag_ranks[name].append(rank)

    ranking = []
    for name, ranks in tag_ranks.items():
        avg = sum(ranks) / len(ranks)
        ranking.append((name, avg, len(ranks)))

    return sorted(ranking, key=lambda x: x[1])


# ==========================
# DATAFRAME
# ==========================
def build_tags_dataframe(data):
    rows = []

    for anime in data:
        title = anime.get("title_romaji") or anime.get("title") or "Untitled"

        rows.append({
            "title_romaji": title,
            "tags_with_rank": json.dumps(extract_clean_tags(anime), ensure_ascii=False)
        })

    return pd.DataFrame(rows)


# ==========================
# MAIN
# ==========================
def main():
    filtered_data = filter_anime_and_save(
        input_file=INPUT_FILE,
        output_file=OUTPUT_FILE,
        require_ranked_tag=False
    )

    print()

    ranking = aggregate_tag_ranks(filtered_data)[:10]

    print("Top 10 tags:")
    for r in ranking:
        print(r)

    print()

    df = build_tags_dataframe(filtered_data)
    print(f"DataFrame rows: {len(df)}")


if __name__ == "__main__":
    main()