// Smart environmental network adapter (Routing to Port 5001)
const API_BASE = window.location.origin.includes('5001') ? '' : 'http://127.0.0.1:5001';

// MOVIE RECOMMENDATION INTERCEPT HANDLER
document.getElementById('movieForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const genre = document.getElementById('genre').value;
    const language = document.getElementById('language').value;
    const sortBy = document.getElementById('sortBy').value;
    const rating = document.getElementById('rating').value;

    const payload = {
        genre: genre,
        language: language,
        sortBy: sortBy,
        rating: rating
    };

    fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errBody => {
                throw new Error(errBody.error || `Server Status Code: ${response.status}`);
            });
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
                li.innerHTML = `<strong>${movie.title}</strong> — ⭐ IMDb Score: ${movie.rating} (Popularity: ${movie.popularity})`;
                movieListElement.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No matching movies found inside this criteria profile.';
            movieListElement.appendChild(li);
        }

        resultSection.style.display = 'block';
    })
    .catch(error => {
        console.error('Fetch operations crash trace:', error);
        alert(`System Issue: ${error.message}`);
    });
});

// PASSIVE AUTHENTICATION LOGIN HANDLER
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const emailInput = document.getElementById('loginEmail').value;
    const passwordInput = document.getElementById('loginPassword').value;

    const payload = { email: emailInput, password: passwordInput };

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
    .catch(error => alert(`Authentication Exception Error: ${error.message}`));
});