// Forgot Password Page JavaScript

// Load users from localStorage
function loadUsers() {
    const savedUsers = localStorage.getItem('mockauth-builder-users');
    if (savedUsers) {
        return JSON.parse(savedUsers);
    } else {
        // Create default admin user
        const defaultUsers = [{
            id: '1',
            name: 'Admin User',
            email: 'admin@mockauth.com',
            password: 'admin123',
            createdAt: new Date().toISOString()
        }];
        localStorage.setItem('mockauth-builder-users', JSON.stringify(defaultUsers));
        return defaultUsers;
    }
}

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
    document.getElementById('resetText').style.display = 'none';
    document.getElementById('resetLoading').style.display = 'inline-block';
    document.getElementById('resetBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('resetText').style.display = 'inline';
    document.getElementById('resetLoading').style.display = 'none';
    document.getElementById('resetBtn').disabled = false;
}

function showSuccess() {
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
}

document.getElementById('forgotPasswordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;

    if (!email) {
        showNotification('❌ Please enter your email', 'error');
        return;
    }

    showLoading();

    setTimeout(() => {
        const users = loadUsers();
        const user = users.find(u => u.email === email);
        
        if (user) {
            hideLoading();
            showSuccess();
            showNotification('✅ Password reset link sent to your email!', 'success');
            
            // In a real app, you would send an email here
            console.log(`Password reset link would be sent to: ${email}`);
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } else {
            hideLoading();
            showNotification('❌ No account found with this email', 'error');
        }
    }, 1500);
});

// Check if user is already logged in
window.addEventListener('load', function() {
    const savedUser = localStorage.getItem('mockauth-builder-user');
    if (savedUser) {
        window.location.href = '/';
    }
});
