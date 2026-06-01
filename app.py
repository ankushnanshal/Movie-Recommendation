import os
import json
import glob
import pandas as pd
from flask import Flask, render_template, request, jsonify

# FLAT DIRECTORY CONFIGURATION: Serves everything directly from the root folder
app = Flask(
    __name__,
    template_folder='.',  # Look for index.html in the same folder
    static_folder='.',    # Look for style.css and script.js in the same folder
    static_url_path=''    # Directly map root files
)

movies_df = pd.DataFrame()

def clean_and_load_dataframe(path):
    """Helper function to parse and clean the TMDB dataset safely."""
    df = pd.read_csv(path)
    df['title'] = df['title'].fillna('Unknown Title').astype(str)
    df['vote_average'] = pd.to_numeric(df['vote_average'], errors='coerce').fillna(0.0)
    df['popularity'] = pd.to_numeric(df['popularity'], errors='coerce').fillna(0.0)
    df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce').fillna(0)
    df['original_language'] = df['original_language'].fillna('en').astype(str)
    df['genres'] = df['genres'].fillna('[]').astype(str)
    return df

# --- INTELIGENCE AUTO-DETECT DATASET SCANNER ---
possible_paths = [
    'tmdb_5000_movies.csv',
    'tmdb_5000_movies.csv.zip',
    'tmdb_5000_movies.csv.zip/tmdb_5000_movies.csv' # Fallback container path
]

# Scan the current folder for any other files containing 'movies' as a fallback safety net
fallback_files = glob.glob("*movies*.csv") + glob.glob("*movies*.zip")
for f in fallback_files:
    if f not in possible_paths:
        possible_paths.append(f)

dataset_loaded = False
for path in possible_paths:
    if os.path.exists(path):
        try:
            print(f"--> Attempting to load dataset from: {path}")
            movies_df = clean_and_load_dataframe(path)
            print(f"--> Success! Loaded {len(movies_df)} movies from '{path}'.")
            dataset_loaded = True
            break
        except Exception as e:
            print(f"--> Found '{path}' but could not read it: {str(e)}")

if not dataset_loaded:
    print("\n❌ CRITICAL ERROR: Could not find your movie CSV or ZIP file!")
    print(f"Current directory files: {os.listdir('.')}")
    print("Please ensure 'tmdb_5000_movies.csv' or 'tmdb_5000_movies.csv.zip' is in this exact folder.\n")

# Inject CORS Headers to ensure requests are never blocked by browsers
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
        return jsonify({
            "movies": [], 
            "error": "Dataset is not loaded on the server. Please check the backend terminal logs to see why the file lookup failed."
        }), 500

    data = request.get_json() if request.is_json else request.values
    if not data:
        return jsonify({"movies": [], "error": "Empty search criteria received."}), 400

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

    # Apply data query filters
    mask_lang = movies_df['original_language'] == selected_lang
    mask_rating = movies_df['vote_average'] >= min_rating
    filtered_df = movies_df[mask_lang & mask_rating].copy()

    if selected_genre:
        genre_mask = filtered_df['genres'].apply(contains_genre)
        filtered_df = filtered_df[genre_mask]

    if sort_by not in ['popularity', 'vote_average', 'revenue']:
        sort_by = 'popularity'

    # Extract top 10 recommended matches
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
    # Running intentionally on Port 5001 to bypass OS conflicts
    app.run(debug=True, port=5001)