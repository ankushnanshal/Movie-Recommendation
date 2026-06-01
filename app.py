import os
import json
import pandas as pd
from flask import Flask, request, jsonify, render_template

# FORCE FLASK TO LOOK IN THE ROOT FOLDER FOR EVERYTHING
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

# Temporary in-memory user registry database
REGISTRATION_DATABASE = {
    "admin@gmail.com": "1234"
}

# Home view route
@app.route('/')
def home():
    # Flask will now look directly in the root folder for index.html
    return render_template("index.html")

# LOGIN CONTROLLER ROUTE
@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200

    data = request.get_json() if request.is_json else request.values
    email = data.get('email')
    password = data.get('password')

    if email in REGISTRATION_DATABASE and REGISTRATION_DATABASE[email] == password:
        return jsonify({"success": True, "message": "Login Successful"})

    return jsonify({"success": False, "message": "Invalid Email or Password"})

# SIGNUP REGISTRATION ROUTE
@app.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200

    data = request.get_json() if request.is_json else request.values
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Fields cannot be empty"}), 400

    if email in REGISTRATION_DATABASE:
        return jsonify({"success": False, "message": "User already exists"})

    REGISTRATION_DATABASE[email] = password
    return jsonify({"success": True, "message": "Signup successful"})

# MOVIE ENGINE ROUTE
@app.route('/recommend', methods=['POST', 'OPTIONS'])
def recommend():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    
    data = request.get_json() if request.is_json else request.values
    genre = data.get('genre')
    language = data.get('language')
    sort_by = data.get('sortBy')
    rating = data.get('rating')
    
    csv_path = 'tmdb_5000_movies.csv.zip'
    if not os.path.exists(csv_path):
        csv_path = 'tmdb_5000_movies.csv'
        
    try:
        df = pd.read_csv(csv_path)
        filtered = df.copy()
        
        if genre:
            def has_genre(x):
                try:
                    g_list = json.loads(x)
                    return any(g['name'].lower() == genre.lower() for g in g_list)
                except:
                    return False
            filtered = filtered[filtered['genres'].apply(has_genre)]
            
        if language:
            filtered = filtered[filtered['original_language'] == language]
            
        if rating:
            filtered = filtered[filtered['vote_average'] >= float(rating)]
            
        if sort_by in ['popularity', 'vote_average', 'revenue']:
            filtered = filtered.sort_values(by=sort_by, ascending=False)
            
        results = []
        for _, row in filtered.head(5).iterrows():
            results.append({
                "title": str(row['title']),
                "rating": float(row['vote_average']),
                "popularity": float(row['popularity'])
            })
            
        return jsonify({"movies": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)