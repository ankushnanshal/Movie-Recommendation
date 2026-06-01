// Smart API connection rule pointing to the updated Flask port 5001
const API_BASE = window.location.origin.includes('5001') ? '' : 'http://127.0.0.1:5001';

document.getElementById('movieForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const payload = {
        genre: document.getElementById('genre').value,
        language: document.getElementById('language').value,
        sortBy: document.getElementById('sortBy').value,
        rating: document.getElementById('rating').value
    };

    fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Server error'); });
        }
        return response.json();
    })
    .then(data => {
        const movieListElement = document.getElementById('movieList');
        const resultSection = document.getElementById('resultSection');
        
        movieListElement.innerHTML = '';

        if (data.movies && data.movies.length > 0) {
            data.movies.forEach(movie => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${movie.title}</strong> — ⭐ Rating: ${movie.rating} (Popularity: ${movie.popularity})`;
                movieListElement.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No matching movies found for this criteria combination.';
            movieListElement.appendChild(li);
        }
        resultSection.style.display = 'block';
    })
    .catch(error => {
        alert(`System Error: ${error.message}`);
    });
});

// LOGIN ACTION
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const payload = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('loginSpace').innerHTML = `<div class="user-badge">👤 Logged in as admin</div>`;
            closeLogin();
            document.getElementById('authForm').reset();
        } else {
            alert(data.message);
        }
    })
    .catch(error => alert(`Authentication Issue: ${error.message}`));
});

// NEW: RESET FORM AND CLEAR SEARCH RESULTS STATE
document.getElementById('resetFormBtn').addEventListener('click', function() {
    // 1. Reset all drop-down selector options to default empty placeholder states
    document.getElementById('movieForm').reset();

    // 2. Erase the interior elements inside the movie recommendation list item containers
    document.getElementById('movieList').innerHTML = '';

    // 3. Hide the entire result display section out of view completely
    document.getElementById('resultSection').style.display = 'none';
});