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
            f"Make sure ANIME_REC.json is in the same folder as this script."
        )

    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Expected ANIME_REC.json to contain a top-level JSON array.")

    return data


# ==========================
# FILTER HELPERS
# ==========================
def has_minimum_tags(anime: dict, min_tags: int = 3) -> bool:
    tags = anime.get("tags", [])
    return isinstance(tags, list) and len(tags) >= min_tags


def has_ranked_tag(anime: dict) -> bool:
    tags = anime.get("tags", [])
    if not isinstance(tags, list):
        return False

    for tag in tags:
        if not isinstance(tag, dict):
            continue
        rank = tag.get("rank")
        if isinstance(rank, int):
            return True

    return False


def extract_clean_tags(anime: dict):
    tags = anime.get("tags", [])
    if not isinstance(tags, list):
        return []

    clean_tags = []
    for tag in tags:
        if not isinstance(tag, dict):
            continue

        name = tag.get("name")
        rank = tag.get("rank")

        if name is None:
            continue

        clean_tags.append({
            "name": name,
            "rank": rank if isinstance(rank, int) else None
        })

    return clean_tags


# ==========================
# FILTER + SAVE FUNCTION
# ==========================
def filter_anime_and_save(
    input_file: Path = INPUT_FILE,
    output_file: Path = OUTPUT_FILE,
    min_tags: int = 3,
    require_ranked_tag: bool = False
):
    data = load_anime_json(input_file)

    print(f"Total anime loaded: {len(data)}")

    before_tag_filter = len(data)
    filtered = [anime for anime in data if has_minimum_tags(anime, min_tags)]
    removed_by_tag_count = before_tag_filter - len(filtered)

    print(f"Anime removed with fewer than {min_tags} tags: {removed_by_tag_count}")
    print(f"Anime remaining after minimum tag filter: {len(filtered)}")

    if require_ranked_tag:
        before_rank_filter = len(filtered)
        filtered = [anime for anime in filtered if has_ranked_tag(anime)]
        removed_by_rank = before_rank_filter - len(filtered)

        print(f"Anime removed without ranked tags: {removed_by_rank}")
        print(f"Anime remaining after ranked-tag filter: {len(filtered)}")

    with output_file.open("w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)

    print(f"Filtered file saved to: {output_file}")

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
        avg_rank = sum(ranks) / len(ranks)
        ranking.append((name, avg_rank, len(ranks)))

    ranking_sorted = sorted(ranking, key=lambda x: x[1])
    return ranking_sorted


# ==========================
# DATAFRAME BUILDER
# ==========================
def build_tags_dataframe(data):
    rows = []

    for anime in data:
        title = anime.get("title_romaji") or anime.get("title") or "Untitled"
        clean_tags = extract_clean_tags(anime)

        rows.append({
            "title_romaji": title,
            "tags_with_rank": json.dumps(clean_tags, ensure_ascii=False)
        })

    df = pd.DataFrame(rows)
    return df


# ==========================
# COMPARISON FUNCTION
# ==========================
def compare_anime_tags(row1, row2):
    tags1 = json.loads(row1["tags_with_rank"])
    tags2 = json.loads(row2["tags_with_rank"])

    tag_dict1 = {tag["name"]: tag["rank"] for tag in tags1 if tag.get("name") is not None}
    tag_dict2 = {tag["name"]: tag["rank"] for tag in tags2 if tag.get("name") is not None}

    all_tags = set(tag_dict1.keys()).union(set(tag_dict2.keys()))
    differences = []

    for tag in all_tags:
        rank1 = tag_dict1.get(tag)
        rank2 = tag_dict2.get(tag)
        if rank1 != rank2:
            differences.append((tag, rank1, rank2))

    return differences


# ==========================
# OPTIONAL PAIRWISE COMPARISON
# WARNING: very slow for large datasets
# ==========================
def run_pairwise_comparison(df, max_pairs=None):
    pair_count = 0

    for i in range(len(df)):
        for j in range(i + 1, len(df)):
            row1 = df.iloc[i]
            row2 = df.iloc[j]
            diffs = compare_anime_tags(row1, row2)

            if diffs:
                print(f"Differences between '{row1['title_romaji']}' and '{row2['title_romaji']}':")
                for tag, rank1, rank2 in diffs:
                    r1 = 0 if rank1 is None else rank1
                    r2 = 0 if rank2 is None else rank2
                    dif = abs(r1 - r2)
                    print(f"{tag}, {dif}")
                print()

            pair_count += 1
            if max_pairs is not None and pair_count >= max_pairs:
                print(f"Stopped early after {max_pairs} pairs.")
                return


# ==========================
# MAIN
# ==========================
def main():
    filtered_data = filter_anime_and_save(
        input_file=INPUT_FILE,
        output_file=OUTPUT_FILE,
        min_tags=3,
        require_ranked_tag=False
    )

    print()

    ranking_sorted = aggregate_tag_ranks(filtered_data)
    top10 = ranking_sorted[:10]

    print("Top 10 tags by average rank (name, avg_rank, count):")
    for r in top10:
        print(r)

    print()

    df = build_tags_dataframe(filtered_data)
    print(f"DataFrame row count: {len(df)}")
    print()

    # Optional: enable only for testing, very slow on large files
    # run_pairwise_comparison(df, max_pairs=20)


if __name__ == "__main__":
    main()