import os
import json
import sqlite3
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
app.secret_key = 'dev-secret-key-change-in-production'
CORS(app, origins=['http://localhost:5001', 'http://127.0.0.1:5001'])

DATABASE_PATH = 'movies.db'
CSV_PATH = 'tmdb_5000_movies.csv'

MOVIE_DATA = None

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=1',
                history TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

def load_movie_data():
    global MOVIE_DATA
    if MOVIE_DATA is None:
        try:
            if not os.path.exists(CSV_PATH):
                return pd.DataFrame()
            df = pd.read_csv(CSV_PATH)
            if 'genres' in df.columns:
                df['genres_list'] = df['genres'].apply(lambda x: [g['name'].lower() for g in json.loads(x)] if pd.notna(x) and x else [])
            MOVIE_DATA = df
        except Exception as e:
            print(f"Error loading movie data: {e}")
            return pd.DataFrame()
    return MOVIE_DATA

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({"success": False, "message": "Please login first"}), 401
        return f(*args, **kwargs)
    return decorated_function

init_db()

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() if request.is_json else request.values
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"}), 400

        with get_db() as conn:
            user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            if user and check_password_hash(user['password_hash'], password):
                session['user'] = email
                return jsonify({
                    "success": True,
                    "message": "Login Successful",
                    "avatar": user['avatar_url']
                })

        return jsonify({"success": False, "message": "Invalid Email or Password"}), 401
    except Exception:
        return jsonify({"success": False, "message": "Login failed. Please try again."}), 500

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json() if request.is_json else request.values
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        avatar = data.get('avatar', 'https://api.dicebear.com/7.x/bottts/svg?seed=1')

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"}), 400

        if len(password) < 6:
            return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

        with get_db() as conn:
            existing = conn.execute('SELECT email FROM users WHERE email = ?', (email,)).fetchone()
            if existing:
                return jsonify({"success": False, "message": "User already exists"}), 409

            password_hash = generate_password_hash(password, method='pbkdf2:sha256')
            conn.execute(
                'INSERT INTO users (email, password_hash, avatar_url) VALUES (?, ?, ?)',
                (email, password_hash, avatar)
            )
            conn.commit()

        return jsonify({"success": True, "message": "Signup successful"})
    except Exception:
        return jsonify({"success": False, "message": "Signup failed. Please try again."}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route('/recommend', methods=['POST'])
@login_required
def recommend():
    try:
        data = request.get_json() if request.is_json else request.values
        genre = data.get('genre', '').strip()
        language = data.get('language', '').strip()
        sort_by = data.get('sortBy', '').strip()
        rating = data.get('rating', '')
        email = session.get('user')

        if not all([genre, language, sort_by, rating]):
            return jsonify({"success": False, "message": "All fields are required"}), 400

        df = load_movie_data()
        if df.empty:
            return jsonify({"success": False, "message": "Movie data unavailable. Please ensure tmdb_5000_movies.csv is in the root directory."}), 503

        filtered = df.copy()

        if genre:
            genre_lower = genre.lower()
            filtered = filtered[filtered['genres_list'].apply(lambda x: genre_lower in x if isinstance(x, list) else False)]

        if language:
            filtered = filtered[filtered['original_language'] == language]

        if rating:
            try:
                rating_val = float(rating)
                filtered = filtered[filtered['vote_average'] >= rating_val]
            except ValueError:
                pass

        if sort_by in ['popularity', 'vote_average', 'revenue'] and sort_by in filtered.columns:
            filtered = filtered.sort_values(by=sort_by, ascending=False)

        results = []
        for _, row in filtered.head(10).iterrows():
            results.append({
                "title": str(row['title']),
                "rating": float(row['vote_average']) if pd.notna(row['vote_average']) else 0,
                "popularity": float(row['popularity']) if pd.notna(row['popularity']) else 0
            })

        if email and results:
            with get_db() as conn:
                user = conn.execute('SELECT history FROM users WHERE email = ?', (email,)).fetchone()
                history = json.loads(user['history']) if user and user['history'] else []
                search_query = f"Genre: {genre or 'Any'}, Lang: {language or 'Any'}, Rating: {rating or 'Any'}"
                history.append({
                    "query": search_query,
                    "movies": results[:5],
                    "timestamp": datetime.now().isoformat()
                })
                if len(history) > 50:
                    history = history[-50:]
                conn.execute('UPDATE users SET history = ? WHERE email = ?', (json.dumps(history), email))
                conn.commit()

        return jsonify({"success": True, "movies": results[:5]})
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get recommendations: {str(e)}"}), 500

@app.route('/history', methods=['POST'])
@login_required
def get_history():
    try:
        email = session.get('user')
        if not email:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        with get_db() as conn:
            user = conn.execute('SELECT history FROM users WHERE email = ?', (email,)).fetchone()
            if not user:
                return jsonify({"success": False, "message": "User not found"}), 404

            history = json.loads(user['history']) if user['history'] else []
            return jsonify({"success": True, "history": history})
    except Exception:
        return jsonify({"success": False, "message": "Failed to fetch history"}), 500

@app.route('/profile/update-avatar', methods=['POST'])
@login_required
def update_avatar():
    try:
        data = request.get_json() if request.is_json else request.values
        avatar_url = data.get('avatar_url', '')
        email = session.get('user')

        if not avatar_url:
            return jsonify({"success": False, "message": "Avatar URL is required"}), 400

        with get_db() as conn:
            conn.execute('UPDATE users SET avatar_url = ? WHERE email = ?', (avatar_url, email))
            conn.commit()

        return jsonify({"success": True, "message": "Avatar updated successfully"})
    except Exception:
        return jsonify({"success": False, "message": "Failed to update avatar"}), 500

@app.route('/profile/delete', methods=['POST'])
@login_required
def delete_account():
    try:
        email = session.get('user')
        data = request.get_json() if request.is_json else request.values
        password = data.get('password', '')

        if not password:
            return jsonify({"success": False, "message": "Password required to delete account"}), 400

        with get_db() as conn:
            user = conn.execute('SELECT password_hash FROM users WHERE email = ?', (email,)).fetchone()
            if not user or not check_password_hash(user['password_hash'], password):
                return jsonify({"success": False, "message": "Invalid password"}), 401

            conn.execute('DELETE FROM users WHERE email = ?', (email,))
            conn.commit()
            session.pop('user', None)

        return jsonify({"success": True, "message": "Account deleted successfully"})
    except Exception:
        return jsonify({"success": False, "message": "Failed to delete account"}), 500

if __name__ == "__main__":
    port = 5001
    app.run(debug=True, port=port, host='0.0.0.0')