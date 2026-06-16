const API_BASE = '';

let currentAuthMode = 'login';

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
            return response.json().then(err => {
                throw new Error(err.error || 'Server error');
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
                li.innerHTML = `<strong>${movie.title}</strong> — Rating: ⭐ ${movie.rating} | Popularity: 🔥 ${movie.popularity.toFixed(1)}`;
                movieListElement.appendChild(li);
            });

            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            movieListElement.innerHTML =
                '<li class="no-results">No movies found matching your criteria. Try adjusting filters!</li>';
            resultSection.style.display = 'block';
        }
    })
    .catch(error => alert(`Recommendation Error: ${error.message}`));
});

document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    const endpoint = currentAuthMode === 'login' ? '/login' : '/signup';

    fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);

            if (currentAuthMode === 'login') {
                const loginSpace = document.getElementById('loginSpace');

                loginSpace.innerHTML = `
                    <span class="user-badge">👤 ${email}</span>
                    <button id="logoutBtn">Logout</button>
                `;

                document.getElementById('logoutBtn').addEventListener('click', function() {
                    loginSpace.innerHTML = `
                        <button onclick="openLogin()">Login</button>
                    `;
                });

                closeLogin();
                document.getElementById('authForm').reset();
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => alert(`Authentication Issue: ${error.message}`));
});

document.getElementById('toggleAuthMode').addEventListener('click', function(e) {
    e.preventDefault();

    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleLabel = document.getElementById('toggleLabel');
    const toggleLink = document.getElementById('toggleAuthMode');

    if (currentAuthMode === 'login') {
        currentAuthMode = 'signup';
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Register';
        toggleLabel.textContent = 'Already have an account?';
        toggleLink.textContent = 'Login Here';
    } else {
        currentAuthMode = 'login';
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        toggleLabel.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
    }
});

document.getElementById('resetFormBtn').addEventListener('click', function() {
    document.getElementById('movieForm').reset();
    document.getElementById('movieList').innerHTML = '';
    document.getElementById('resultSection').style.display = 'none';
});