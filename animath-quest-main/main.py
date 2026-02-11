import json
import csv
from collections import defaultdict
import math

def load_anime_from_csv(csv_file):
    """Load anime data from CSV file."""
    anime_list = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse the JSON data from the row
            # Assuming each row contains the full JSON object
            try:
                anime_data = json.loads(row.get('data', '{}'))
                anime_list.append(anime_data)
            except:
                # If data is spread across columns
                anime_list.append(row)
    
    return anime_list

def extract_tags(anime):
    """Extract tags and their ranks from anime data."""
    tags = {}
    
    if isinstance(anime.get('tags'), str):
        try:
            tags_data = json.loads(anime['tags'])
        except:
            return tags
    else:
        tags_data = anime.get('tags', [])
    
    for tag in tags_data:
        if isinstance(tag, dict):
            tag_name = tag.get('name', '')
            # Handle MongoDB number types
            rank_value = tag.get('rank', 0)
            if isinstance(rank_value, dict):
                rank = int(rank_value.get('$numberInt', 0))
            else:
                rank = int(rank_value) if rank_value else 0
            
            if tag_name:
                tags[tag_name] = rank
    
    return tags

def calculate_similarity(anime1, anime2):
    """
    Calculate similarity score between two anime based on their tags.
    Returns a score from 0 to 10.
    """
    tags1 = extract_tags(anime1)
    tags2 = extract_tags(anime2)
    
    # If either anime has no tags, return 0
    if not tags1 or not tags2:
        return 0.0
    
    # Get all unique tags
    all_tags = set(tags1.keys()) | set(tags2.keys())
    
    if not all_tags:
        return 0.0
    
    # Calculate cosine similarity using tag ranks as vector components
    dot_product = 0
    magnitude1 = 0
    magnitude2 = 0
    
    for tag in all_tags:
        rank1 = tags1.get(tag, 0)
        rank2 = tags2.get(tag, 0)
        
        dot_product += rank1 * rank2
        magnitude1 += rank1 ** 2
        magnitude2 += rank2 ** 2
    
    # Avoid division by zero
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    # Cosine similarity
    cosine_sim = dot_product / (math.sqrt(magnitude1) * math.sqrt(magnitude2))
    
    # Convert to 0-10 scale
    similarity_score = cosine_sim * 10
    
    return round(similarity_score, 1)

def get_anime_title(anime):
    """Extract the preferred title from anime data."""
    if isinstance(anime, dict):
        return anime.get('title_userPreferred', 
               anime.get('title_romaji', 
               anime.get('title', 'Unknown')))
    return str(anime)

def compare_all_anime(csv_file, output_file='anime_similarity_matrix.json'):
    """
    Compare all anime from CSV and create a similarity matrix.
    Saves results to a JSON file.
    """
    print("Loading anime data...")
    anime_list = load_anime_from_csv(csv_file)
    
    print(f"Loaded {len(anime_list)} anime")
    
    # Create similarity matrix
    similarity_matrix = {}
    
    print("Calculating similarities...")
    for i, anime1 in enumerate(anime_list):
        title1 = get_anime_title(anime1)
        similarity_matrix[title1] = {}
        
        for j, anime2 in enumerate(anime_list):
            title2 = get_anime_title(anime2)
            
            if i == j:
                # Same anime, perfect similarity
                similarity_matrix[title1][title2] = 10.0
            else:
                # Calculate similarity
                score = calculate_similarity(anime1, anime2)
                similarity_matrix[title1][title2] = score
        
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1}/{len(anime_list)} anime...")
    
    # Save to JSON file
    print(f"Saving results to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(similarity_matrix, f, indent=2, ensure_ascii=False)
    
    print("Done!")
    return similarity_matrix

def create_csv_table(similarity_matrix, output_csv='anime_similarity_table.csv'):
    """Create a CSV table from the similarity matrix."""
    anime_titles = list(similarity_matrix.keys())
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write header
        writer.writerow([''] + anime_titles)
        
        # Write rows
        for title1 in anime_titles:
            row = [title1]
            for title2 in anime_titles:
                row.append(similarity_matrix[title1].get(title2, 0))
            writer.writerow(row)
    
    print(f"CSV table saved to {output_csv}")

# Main execution
if __name__ == "__main__":
    # Example usage
    csv_file = "ANIME_REC.anime_final.csv"  # Replace with your CSV file path
    
    # Compare all anime and get similarity matrix
    similarity_matrix = compare_all_anime(csv_file)
    
    # Also create a CSV table for easy viewing
    create_csv_table(similarity_matrix)
    
    # Print some example results
    print("\nExample similarities:")
    anime_titles = list(similarity_matrix.keys())[:3]
    for title in anime_titles:
        print(f"\n{title}:")
        scores = similarity_matrix[title]
        # Show top 5 most similar (excluding itself)
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        for other_title, score in sorted_scores[1:6]:
            print(f"  - {other_title}: {score}/10")