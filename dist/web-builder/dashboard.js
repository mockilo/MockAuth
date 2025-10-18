// MockAuth Dashboard JavaScript
// Now integrated with MockAuth Backend API

const API_BASE = '/auth';
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuth();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load stats
    loadStats();
});

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Open builder button
    const openBuilderBtn = document.querySelector('[data-action="open-builder"]');
    if (openBuilderBtn) openBuilderBtn.addEventListener('click', () => {
        window.location.href = '/builder';
    });
    
    // Quick action buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', (e) => loadPreset(e.target.dataset.preset));
    });
    
    // New project button
    const newProjectBtn = document.querySelector('[data-action="new-project"]');
    if (newProjectBtn) newProjectBtn.addEventListener('click', () => {
        window.open('/builder', '_blank');
    });
}

async function checkAuth() {
    const token = localStorage.getItem('mockauth-access-token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        // Verify token with backend
        const response = await fetch(`${API_BASE}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            currentUser = data.data;
            const displayName = currentUser.profile?.firstName || currentUser.username || currentUser.email;
            document.getElementById('userName').textContent = `Welcome, ${displayName}`;
            
            // Update localStorage with fresh user data
            localStorage.setItem('mockauth-user', JSON.stringify({
                id: currentUser.id,
                email: currentUser.email,
                username: currentUser.username,
                name: displayName
            }));
            
            loadStats();
        } else {
            // Token is invalid, redirect to login
            localStorage.removeItem('mockauth-access-token');
            localStorage.removeItem('mockauth-refresh-token');
            localStorage.removeItem('mockauth-user');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // On error, try to use cached user data
        const cachedUser = localStorage.getItem('mockauth-user');
        if (cachedUser) {
            currentUser = JSON.parse(cachedUser);
            document.getElementById('userName').textContent = `Welcome, ${currentUser.name}`;
            loadStats();
        } else {
            window.location.href = '/login';
        }
    }
}

async function loadStats() {
    try {
        // Fetch real stats from backend API
        const response = await fetch('/api/builder/stats');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.data.totalUsers || '0';
            document.getElementById('totalConfigs').textContent = data.data.totalConfigs || '0';
            document.getElementById('totalEndpoints').textContent = data.data.totalEndpoints || '0';
        } else {
            // Fallback to localStorage
            loadStatsFromLocalStorage();
        }
    } catch (error) {
        console.error('Failed to load stats from API:', error);
        // Fallback to localStorage
        loadStatsFromLocalStorage();
    }
    
    // Format last login date
    if (currentUser) {
        const lastLoginDate = new Date(currentUser.lastLogin || Date.now());
        const today = new Date();
        const isToday = lastLoginDate.toDateString() === today.toDateString();
        
        if (isToday) {
            document.getElementById('lastLogin').textContent = 'Today';
        } else {
            document.getElementById('lastLogin').textContent = lastLoginDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }
}

function loadStatsFromLocalStorage() {
    // Fallback: Load saved configurations from localStorage
    const savedConfigs = localStorage.getItem('mockauth-builder-state');
    const configs = savedConfigs ? JSON.parse(savedConfigs) : {};
    
    document.getElementById('totalConfigs').textContent = savedConfigs ? '1' : '0';
    document.getElementById('totalUsers').textContent = configs.users ? configs.users.length : '0';
    document.getElementById('totalEndpoints').textContent = configs.endpoints ? configs.endpoints.length : '0';
}

async function handleLogout() {
    const token = localStorage.getItem('mockauth-access-token');
    
    if (token) {
        try {
            // Call logout API
            await fetch(`${API_BASE}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout API error:', error);
        }
    }
    
    // Clear all auth data
    localStorage.removeItem('mockauth-access-token');
    localStorage.removeItem('mockauth-refresh-token');
    localStorage.removeItem('mockauth-user');
    
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}

function loadPreset(preset) {
    const presets = {
        basic: {
            port: 3001,
            enableMFA: false,
            enablePasswordReset: true,
            enableAccountLockout: true,
            maxLoginAttempts: 3,
            databaseType: 'memory',
            enableMockTail: false,
            enableSchemaGhost: false
        },
        enterprise: {
            port: 3001,
            enableMFA: true,
            enablePasswordReset: true,
            enableAccountLockout: true,
            maxLoginAttempts: 5,
            databaseType: 'postgresql',
            enableMockTail: true,
            enableSchemaGhost: true
        },
        development: {
            port: 3001,
            enableMFA: false,
            enablePasswordReset: false,
            enableAccountLockout: false,
            maxLoginAttempts: 10,
            databaseType: 'sqlite',
            enableMockTail: true,
            enableSchemaGhost: true
        }
    };

    const config = presets[preset];
    if (config) {
        localStorage.setItem('mockauth-builder-preset', JSON.stringify(config));
        showNotification(`${preset.charAt(0).toUpperCase() + preset.slice(1)} preset loaded!`, 'success');
        setTimeout(() => {
            window.location.href = '/builder';
        }, 1000);
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
