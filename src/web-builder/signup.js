// Signup Page JavaScript
// Now integrated with MockAuth Backend API

const API_BASE = '/auth';

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function showLoading() {
    document.getElementById('signupText').style.display = 'none';
    document.getElementById('signupLoading').style.display = 'inline-block';
    document.getElementById('signupBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('signupText').style.display = 'inline';
    document.getElementById('signupLoading').style.display = 'none';
    document.getElementById('signupBtn').disabled = false;
}

function checkPasswordStrength(password) {
    const strengthDiv = document.getElementById('passwordStrength');
    let strength = 0;
    let message = '';

    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    if (strength < 2) {
        message = 'Weak password';
        strengthDiv.className = 'password-strength strength-weak';
    } else if (strength < 4) {
        message = 'Medium strength';
        strengthDiv.className = 'password-strength strength-medium';
    } else {
        message = 'Strong password';
        strengthDiv.className = 'password-strength strength-strong';
    }

    strengthDiv.textContent = message;
}

// Password strength indicator
document.getElementById('password').addEventListener('input', function(e) {
    checkPasswordStrength(e.target.value);
});

document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        showNotification('❌ Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('❌ Passwords do not match', 'error');
        return;
    }

    if (password.length < 8) {
        showNotification('❌ Password must be at least 8 characters', 'error');
        return;
    }

    showLoading();

    try {
        // Call backend API to register user
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                username: name.toLowerCase().replace(/\s+/g, ''),
                profile: {
                    firstName: name.split(' ')[0] || name,
                    lastName: name.split(' ').slice(1).join(' ') || ''
                }
            })
        });

        const data = await response.json();

        if (data.success && data.data) {
            // Store JWT tokens in localStorage
            localStorage.setItem('mockauth-access-token', data.data.token);
            if (data.data.refreshToken) {
                localStorage.setItem('mockauth-refresh-token', data.data.refreshToken);
            }
            
            // Store user info for display purposes
            localStorage.setItem('mockauth-user', JSON.stringify({
                id: data.data.user.id,
                email: data.data.user.email,
                username: data.data.user.username,
                name: name
            }));
            
            hideLoading();
            showNotification('✅ Account created successfully! Redirecting...', 'success');
            
            // Notify builder about new user (if builder is open)
            if (window.opener && window.opener.refreshBuilderUsers) {
                window.opener.refreshBuilderUsers();
            }
            
            // Also try to notify any open builder tabs
            if (window.parent && window.parent !== window && window.parent.refreshBuilderUsers) {
                window.parent.refreshBuilderUsers();
            }
            
            // Store a flag for builder to detect new signups
            localStorage.setItem('mockauth-new-signup', JSON.stringify({
                timestamp: Date.now(),
                user: {
                    email: data.data.user.email,
                    username: data.data.user.username,
                    name: name
                }
            }));
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            hideLoading();
            showNotification(`❌ ${data.error || 'Registration failed'}`, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        showNotification('❌ Failed to connect to server. Please try again.', 'error');
    }
});

// Check if user is already logged in
window.addEventListener('load', function() {
    const token = localStorage.getItem('mockauth-access-token');
    if (token) {
        window.location.href = '/';
    }
});
