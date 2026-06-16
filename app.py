import os
import json
import pandas as pd
from flask import Flask, request, jsonify, render_template

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

USER_FILE = 'users.json'

def load_users():
    if not os.path.exists(USER_FILE):
        initial_db = {"admin@gmail.com": {"password": "1234", "history": []}}
        save_users(initial_db)
        return initial_db
    try:
        with open(USER_FILE, 'r') as f:
            data = json.load(f)
            for email in data:
                if isinstance(data[email], str):
                    data[email] = {"password": data[email], "history": []}
                elif "history" not in data[email]:
                    data[email]["history"] = []
            return data
    except Exception:
        return {"admin@gmail.com": {"password": "1234", "history": []}}

def save_users(users_dict):
    with open(USER_FILE, 'w') as f:
        json.dump(users_dict, f, indent=4)

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200

    data = request.get_json() if request.is_json else request.values
    email = data.get('email')
    password = data.get('password')

    registration_database = load_users()

    if email in registration_database and registration_database[email]["password"] == password:
        return jsonify({"success": True, "message": "Login Successful"})

    return jsonify({"success": False, "message": "Invalid Email or Password"})

@app.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200

    data = request.get_json() if request.is_json else request.values
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Fields cannot be empty"}), 400

    registration_database = load_users()

    if email in registration_database:
        return jsonify({"success": False, "message": "User already exists"})

    registration_database[email] = {"password": password, "history": []}
    save_users(registration_database)
    
    return jsonify({"success": True, "message": "Signup successful"})

@app.route('/recommend', methods=['POST', 'OPTIONS'])
def recommend():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    
    data = request.get_json() if request.is_json else request.values
    genre = data.get('genre')
    language = data.get('language')
    sort_by = data.get('sortBy')
    rating = data.get('rating')
    email = data.get('email')
    
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
            
        if email and results:
            registration_database = load_users()
            if email in registration_database:
                search_query = f"Genre: {genre or 'Any'}, Lang: {language or 'Any'}"
                history_item = {
                    "query": search_query,
                    "movies": results
                }
                registration_database[email]["history"].append(history_item)
                save_users(registration_database)

        return jsonify({"movies": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/history', methods=['POST', 'OPTIONS'])
def get_history():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    
    data = request.get_json() if request.is_json else request.values
    email = data.get('email')
    
    if not email:
        return jsonify({"success": False, "message": "Email required"}), 400
        
    registration_database = load_users()
    if email in registration_database:
        return jsonify({"success": True, "history": registration_database[email].get("history", [])})
        
    return jsonify({"success": False, "message": "User not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5001)