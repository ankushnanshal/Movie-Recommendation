const API_BASE = window.location.origin.includes('5001') ? '' : 'http://127.0.0.1:5001';

// Auth Mode Tracker State ('login' or 'signup')
let currentAuthMode = 'login';

// RECOMMENDATION ENGINE TRIGGER
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

// DYNAMIC LOGIN & SIGN UP ACTION CONTROLLER
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const payload = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    const targetEndpoint = currentAuthMode === 'login' ? '/login' : '/signup';

    fetch(`${API_BASE}${targetEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (currentAuthMode === 'signup') {
                alert("Account successfully created! You can now log in.");
                // Automatically flip the view back to login view smoothly
                document.getElementById('toggleAuthMode').click();
            } else {
                document.getElementById('loginSpace').innerHTML = `<div class="user-badge">👤 Logged in as ${payload.email.split('@')[0]}</div>`;
                closeLogin();
                document.getElementById('authForm').reset();
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => alert(`Authentication Issue: ${error.message}`));
});

// STABLE MULTI-MODE TOGGLE (Preserves the Element and Event Listeners)
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

// RESET VIEW STATES MANAGER
document.getElementById('resetFormBtn').addEventListener('click', function() {
    document.getElementById('movieForm').reset();
    document.getElementById('movieList').innerHTML = '';
    document.getElementById('resultSection').style.display = 'none';
});