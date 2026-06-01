import os
import json
import pandas as pd
from flask import Flask, render_template, request, jsonify

# FLAT DIRECTORY CONFIGURATION: Instructs Flask to serve everything from the root folder
app = Flask(
    __name__,
    template_folder='.',  # Look for index.html in the root folder
    static_folder='.',    # Look for style.css and script.js in the root folder
    static_url_path=''    # Allow direct mapping (e.g., /style.css maps to ./style.css)
)

DATASET_PATH = 'tmdb_5000_movies.csv.zip/tmdb_5000_movies.csv'
if not os.path.exists(DATASET_PATH):
    DATASET_PATH = 'tmdb_5000_movies.csv'

movies_df = pd.DataFrame()

if os.path.exists(DATASET_PATH):
    try:
        movies_df = pd.read_csv(DATASET_PATH)
        movies_df['title'] = movies_df['title'].fillna('Unknown Title').astype(str)
        movies_df['vote_average'] = pd.to_numeric(movies_df['vote_average'], errors='coerce').fillna(0.0)
        movies_df['popularity'] = pd.to_numeric(movies_df['popularity'], errors='coerce').fillna(0.0)
        movies_df['revenue'] = pd.to_numeric(movies_df['revenue'], errors='coerce').fillna(0)
        movies_df['original_language'] = movies_df['original_language'].fillna('en').astype(str)
        movies_df['genres'] = movies_df['genres'].fillna('[]').astype(str)
        print("--> Success: TMDB dataset successfully loaded and cleaned.")
    except Exception as e:
        print(f"--> Error loading dataset: {str(e)}")
else:
    print(f"--> Critical Warning: Could not locate movie dataset at '{DATASET_PATH}'")

# Global CORS rule to prevent cross-origin blocks across different ports/live-servers
@app.after_request
def inject_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    
    data = request.get_json() if request.is_json else request.values
    email = data.get('email')
    password = data.get('password')

    if email == "admin@gmail.com" and password == "1234":
        return jsonify({"success": True, "message": "Login Successful"})
    return jsonify({"success": False, "message": "Invalid Email or Password"})

@app.route('/recommend', methods=['POST', 'OPTIONS'])
def recommend():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200

    global movies_df
    if movies_df.empty:
        return jsonify({"movies": [], "error": "Dataset is not loaded on the server."}), 500

    data = request.get_json() if request.is_json else request.values
    if not data:
        return jsonify({"movies": [], "error": "Empty payload request data."}), 400

    selected_genre = str(data.get('genre', '')).strip()
    selected_lang = str(data.get('language', '')).strip()
    sort_by = str(data.get('sortBy', 'popularity')).strip()
    
    try:
        min_rating = float(data.get('rating', 0))
    except (ValueError, TypeError):
        min_rating = 0.0

    def contains_genre(genres_json_str):
        try:
            genres_list = json.loads(genres_json_str)
            return any(g['name'].lower() == selected_genre.lower() for g in genres_list)
        except Exception:
            return False

    # Apply data filtering matrices
    mask_lang = movies_df['original_language'] == selected_lang
    mask_rating = movies_df['vote_average'] >= min_rating
    filtered_df = movies_df[mask_lang & mask_rating].copy()

    if selected_genre:
        genre_mask = filtered_df['genres'].apply(contains_genre)
        filtered_df = filtered_df[genre_mask]

    if sort_by not in ['popularity', 'vote_average', 'revenue']:
        sort_by = 'popularity'

    # Extract top 10 results match recommendations
    results = filtered_df.sort_values(by=sort_by, ascending=False).head(10)

    movie_list = []
    for _, row in results.iterrows():
        movie_list.append({
            "title": str(row['title']),
            "rating": float(row['vote_average']),
            "popularity": float(round(row['popularity'], 2))
        })

    return jsonify({"movies": movie_list})

if __name__ == '__main__':
    # Using port 5001 to completely bypass hidden operating system blockades
    app.run(debug=True, port=5001)