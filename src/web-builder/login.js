// Login Page JavaScript
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
    document.getElementById('loginText').style.display = 'none';
    document.getElementById('loginLoading').style.display = 'inline-block';
    document.getElementById('loginBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('loginText').style.display = 'inline';
    document.getElementById('loginLoading').style.display = 'none';
    document.getElementById('loginBtn').disabled = false;
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showNotification('❌ Please fill in all fields', 'error');
        return;
    }

    showLoading();

    try {
        // Call backend API to login
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
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
                name: data.data.user.profile?.firstName || data.data.user.username
            }));
            
            hideLoading();
            showNotification('✅ Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            hideLoading();
            showNotification(`❌ ${data.error || 'Invalid email or password'}`, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
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
