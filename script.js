const API_BASE = '';

let currentAuthMode = 'login';
let selectedAvatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=1';

function showNotification(message, isSuccess = true) {
    const notification = document.getElementById('statusNotification');
    notification.textContent = message;
    notification.style.backgroundColor = isSuccess ? '#4BB543' : '#D8000C';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

function selectAvatar(element) {
    document.querySelectorAll('.avatar-option').forEach(img => img.classList.remove('selected'));
    element.classList.add('selected');
    selectedAvatarUrl = element.src;
}

function confirmProfileUpdate(newSrc) {
    selectedAvatarUrl = newSrc;
    const badgeImg = document.getElementById('userBadgeImg');
    if (badgeImg) {
        badgeImg.src = newSrc;
    }
    closeProfilePopup();
    showNotification("Profile picture updated successfully!", true);
}

function toggleDropdownMenu() {
    const menu = document.getElementById('avatarDropdownMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

document.addEventListener('click', function(e) {
    const container = document.querySelector('.user-profile-wrapper');
    const menu = document.getElementById('avatarDropdownMenu');
    if (container && menu && !container.contains(e.target)) {
        menu.classList.remove('active');
    }
});

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
    .catch(error => showNotification(`Recommendation Error: ${error.message}`, false));
});

document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        showNotification("Please fill in all fields.", false);
        return;
    }

    const endpoint = currentAuthMode === 'login' ? '/login' : '/signup';
    const bodyData = { email, password };
    if (currentAuthMode === 'signup') {
        bodyData.avatar = selectedAvatarUrl;
    }

    fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, true);

            if (currentAuthMode === 'login') {
                const loginSpace = document.getElementById('loginSpace');

                loginSpace.innerHTML = `
                    <div class="user-profile-wrapper">
                        <img src="${selectedAvatarUrl}" id="userBadgeImg" class="user-avatar-trigger" onclick="toggleDropdownMenu()" alt="Profile">
                        <div class="avatar-dropdown-menu" id="avatarDropdownMenu">
                            <div class="dropdown-header" title="${email}">${email}</div>
                            <button onclick="openProfilePopup(); toggleDropdownMenu();"><i class="fa-solid fa-image"></i> Update Photo</button>
                            <button id="logoutBtn"><i class="fa-solid fa-sign-out-alt"></i> Logout</button>
                        </div>
                    </div>
                `;

                document.getElementById('logoutBtn').addEventListener('click', function() {
                    loginSpace.innerHTML = `
                        <button class="login-button" onclick="openLogin()"><i class="fa-solid fa-user"></i></button>
                    `;
                });

                closeLogin();
                document.getElementById('authForm').reset();
            } else {
                currentAuthMode = 'login';
                document.getElementById('authTitle').textContent = 'Login';
                document.getElementById('authSubmitBtn').textContent = 'Login';
                document.getElementById('toggleLabel').textContent = "Don't have an account?";
                document.getElementById('toggleAuthMode').textContent = 'Sign Up';
                document.getElementById('avatarSelectionWrapper').style.display = 'none';
                document.getElementById('authForm').reset();
            }
        } else {
            showNotification(data.message, false);
        }
    })
    .catch(error => showNotification(`Authentication Issue: ${error.message}`, false));
});

document.getElementById('toggleAuthMode').addEventListener('click', function(e) {
    e.preventDefault();

    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleLabel = document.getElementById('toggleLabel');
    const toggleLink = document.getElementById('toggleAuthMode');
    const avatarWrapper = document.getElementById('avatarSelectionWrapper');

    if (currentAuthMode === 'login') {
        currentAuthMode = 'signup';
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Register';
        toggleLabel.textContent = 'Already have an account?';
        toggleLink.textContent = 'Login Here';
        avatarWrapper.style.display = 'block';
    } else {
        currentAuthMode = 'login';
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        toggleLabel.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
        avatarWrapper.style.display = 'none';
    }
});

document.getElementById('resetFormBtn').addEventListener('click', function() {
    document.getElementById('movieForm').reset();
    document.getElementById('movieList').innerHTML = '';
    document.getElementById('resultSection').style.display = 'none';
});