const API_BASE = '';

let currentAuthMode = 'login';
let selectedAvatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=1';
let loggedInEmail = null;
let currentAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=1';

function showNotification(message, isSuccess = true) {
    const notification = document.getElementById('statusNotification');
    notification.textContent = message;
    notification.style.backgroundColor = isSuccess ? '#4BB543' : '#D8000C';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

function setSubmitButtonLoading(loading) {
    const btn = document.getElementById('submitBtn');
    if (loading) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;
    } else {
        btn.innerHTML = 'Find Best Movies';
        btn.disabled = false;
    }
}

function setAuthButtonLoading(loading) {
    const btn = document.getElementById('authSubmitBtn');
    if (loading) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
    } else {
        btn.innerHTML = currentAuthMode === 'login' ? 'Login' : 'Register';
        btn.disabled = false;
    }
}

function validateForm() {
    const fields = ['genre', 'language', 'sortBy', 'rating'];
    let isValid = true;
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        if (!element.value) {
            errorElement.textContent = 'This field is required';
            element.classList.add('error');
            isValid = false;
        } else {
            errorElement.textContent = '';
            element.classList.remove('error');
        }
    });
    
    return isValid;
}

function selectAvatar(element) {
    document.querySelectorAll('.avatar-option').forEach(img => img.classList.remove('selected'));
    element.classList.add('selected');
    selectedAvatarUrl = element.src;
}

async function confirmProfileUpdate(newSrc) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/profile/update-avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: newSrc })
        });
        const data = await response.json();
        if (data.success) {
            selectedAvatarUrl = newSrc;
            currentAvatar = newSrc;
            const badgeImg = document.getElementById('userBadgeImg');
            if (badgeImg) {
                badgeImg.src = newSrc;
            }
            closeProfilePopup();
            showNotification('Profile picture updated successfully!', true);
        } else {
            showNotification(data.message || 'Failed to update avatar', false);
        }
    } catch (error) {
        showNotification('Failed to update avatar. Please try again.', false);
    } finally {
        showLoading(false);
    }
}

function toggleDropdownMenu() {
    const menu = document.getElementById('avatarDropdownMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

function openLogin() {
    document.getElementById('loginPopup').style.display = 'flex';
    document.getElementById('authForm').reset();
    document.getElementById('loginEmailError').textContent = '';
    document.getElementById('loginPasswordError').textContent = '';
}

function closeLogin() {
    document.getElementById('loginPopup').style.display = 'none';
}

function openProfilePopup() {
    document.getElementById('profilePopup').style.display = 'flex';
}

function closeProfilePopup() {
    document.getElementById('profilePopup').style.display = 'none';
}

function openDeletePopup() {
    document.getElementById('deleteAccountPopup').style.display = 'flex';
}

function closeDeletePopup() {
    document.getElementById('deleteAccountPopup').style.display = 'none';
    document.getElementById('deleteAccountForm').reset();
}

document.addEventListener('click', function(e) {
    const container = document.querySelector('.user-profile-wrapper');
    const menu = document.getElementById('avatarDropdownMenu');
    if (container && menu && !container.contains(e.target)) {
        menu.classList.remove('active');
    }
});

document.getElementById('movieForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        showNotification('Please fill in all required fields', false);
        return;
    }

    if (!loggedInEmail) {
        showNotification('Please login first to get recommendations', false);
        openLogin();
        return;
    }

    const payload = {
        genre: document.getElementById('genre').value,
        language: document.getElementById('language').value,
        sortBy: document.getElementById('sortBy').value,
        rating: document.getElementById('rating').value
    };

    setSubmitButtonLoading(true);
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Server error');
        }

        const movieListElement = document.getElementById('movieList');
        const resultSection = document.getElementById('resultSection');

        movieListElement.innerHTML = '';

        if (data.movies && data.movies.length > 0) {
            data.movies.forEach(movie => {
                const li = document.createElement('li');
                const title = document.createElement('strong');
                title.textContent = movie.title;
                const details = document.createTextNode(` — Rating: ⭐ ${movie.rating} | Popularity: 🔥 ${movie.popularity.toFixed(1)}`);
                li.appendChild(title);
                li.appendChild(details);
                movieListElement.appendChild(li);
            });

            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            const li = document.createElement('li');
            li.className = 'no-results';
            li.textContent = 'No movies found matching your criteria. Try adjusting filters!';
            movieListElement.appendChild(li);
            resultSection.style.display = 'block';
        }
    } catch (error) {
        showNotification(error.message || 'Failed to get recommendations', false);
    } finally {
        setSubmitButtonLoading(false);
        showLoading(false);
    }
});

document.getElementById('authForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    document.getElementById('loginEmailError').textContent = '';
    document.getElementById('loginPasswordError').textContent = '';

    let isValid = true;
    if (!email) {
        document.getElementById('loginEmailError').textContent = 'Email is required';
        isValid = false;
    }
    if (!password) {
        document.getElementById('loginPasswordError').textContent = 'Password is required';
        isValid = false;
    } else if (currentAuthMode === 'signup' && password.length < 6) {
        document.getElementById('loginPasswordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }

    if (!isValid) return;

    const endpoint = currentAuthMode === 'login' ? '/login' : '/signup';
    const bodyData = { email, password };
    if (currentAuthMode === 'signup') {
        bodyData.avatar = selectedAvatarUrl;
    }

    setAuthButtonLoading(true);
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, true);

            if (currentAuthMode === 'login') {
                loggedInEmail = email;
                if (data.avatar) {
                    currentAvatar = data.avatar;
                    selectedAvatarUrl = data.avatar;
                }
                const loginSpace = document.getElementById('loginSpace');

                loginSpace.innerHTML = `
                    <div class="user-profile-wrapper">
                        <img src="${selectedAvatarUrl}" id="userBadgeImg" class="user-avatar-trigger" onclick="toggleDropdownMenu()" alt="Profile">
                        <div class="avatar-dropdown-menu" id="avatarDropdownMenu">
                            <div class="dropdown-header" title="${email}">${email}</div>
                            <button onclick="fetchHistory(); toggleDropdownMenu();"><i class="fa-solid fa-history"></i> Recommendation History</button>
                            <button onclick="openProfilePopup(); toggleDropdownMenu();"><i class="fa-solid fa-image"></i> Update Photo</button>
                            <button onclick="handleLogout(); toggleDropdownMenu();"><i class="fa-solid fa-sign-out-alt"></i> Logout</button>
                            <button onclick="openDeletePopup(); toggleDropdownMenu();" style="color: #ff6b6b;"><i class="fa-solid fa-trash"></i> Delete Account</button>
                        </div>
                    </div>
                `;

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
                showNotification('Account created! Please login.', true);
            }
        } else {
            showNotification(data.message, false);
        }
    } catch (error) {
        showNotification('Authentication failed. Please try again.', false);
    } finally {
        setAuthButtonLoading(false);
        showLoading(false);
    }
});

async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            loggedInEmail = null;
            const loginSpace = document.getElementById('loginSpace');
            loginSpace.innerHTML = `
                <button class="login-button" onclick="openLogin()"><i class="fa-solid fa-user"></i></button>
            `;
            showNotification('Logged out successfully', true);
        }
    } catch (error) {
        showNotification('Logout failed', false);
    }
}

async function fetchHistory() {
    if (!loggedInEmail) return;

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch history');
        }

        const movieListElement = document.getElementById('movieList');
        const resultSection = document.getElementById('resultSection');
        
        movieListElement.innerHTML = '';
        const header = document.createElement('li');
        header.className = 'history-header';
        const h3 = document.createElement('h3');
        h3.textContent = 'Your Recommendation History';
        header.appendChild(h3);
        movieListElement.appendChild(header);
        
        if (data.history && data.history.length > 0) {
            data.history.forEach((search, index) => {
                const searchTitle = document.createElement('li');
                searchTitle.className = 'history-search-title';
                const strong = document.createElement('strong');
                strong.textContent = `Search #${index + 1} (${search.query}):`;
                searchTitle.appendChild(strong);
                movieListElement.appendChild(searchTitle);

                search.movies.forEach(movie => {
                    const li = document.createElement('li');
                    li.className = 'history-movie-item';
                    const title = document.createElement('strong');
                    title.textContent = movie.title;
                    const details = document.createTextNode(` — ⭐ ${movie.rating} | 🔥 ${movie.popularity.toFixed(1)}`);
                    li.appendChild(title);
                    li.appendChild(details);
                    movieListElement.appendChild(li);
                });
            });
        } else {
            const li = document.createElement('li');
            li.className = 'no-results';
            li.textContent = 'No history found yet. Start exploring movies!';
            movieListElement.appendChild(li);
        }
        
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showNotification(error.message || 'Failed to fetch history', false);
    } finally {
        showLoading(false);
    }
}

document.getElementById('deleteAccountForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const password = document.getElementById('deletePassword').value;
    document.getElementById('deletePasswordError').textContent = '';

    if (!password) {
        document.getElementById('deletePasswordError').textContent = 'Password is required';
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/profile/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            closeDeletePopup();
            loggedInEmail = null;
            const loginSpace = document.getElementById('loginSpace');
            loginSpace.innerHTML = `
                <button class="login-button" onclick="openLogin()"><i class="fa-solid fa-user"></i></button>
            `;
            showNotification('Account deleted successfully', true);
            document.getElementById('movieList').innerHTML = '';
            document.getElementById('resultSection').style.display = 'none';
        } else {
            showNotification(data.message || 'Failed to delete account', false);
        }
    } catch (error) {
        showNotification('Failed to delete account. Please try again.', false);
    } finally {
        showLoading(false);
    }
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
    document.getElementById('authForm').reset();
    document.getElementById('loginEmailError').textContent = '';
    document.getElementById('loginPasswordError').textContent = '';
});

document.getElementById('resetFormBtn').addEventListener('click', function() {
    document.getElementById('movieForm').reset();
    document.getElementById('movieList').innerHTML = '';
    document.getElementById('resultSection').style.display = 'none';
    ['genre', 'language', 'sortBy', 'rating'].forEach(fieldId => {
        document.getElementById(fieldId).classList.remove('error');
        document.getElementById(fieldId + 'Error').textContent = '';
    });
});

document.getElementById('loginEmail').addEventListener('input', function() {
    document.getElementById('loginEmailError').textContent = '';
});

document.getElementById('loginPassword').addEventListener('input', function() {
    document.getElementById('loginPasswordError').textContent = '';
});

document.getElementById('deletePassword').addEventListener('input', function() {
    document.getElementById('deletePasswordError').textContent = '';
});