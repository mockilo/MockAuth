// MockAuth Builder JavaScript
// Now integrated with MockAuth Backend API

const API_BASE = '/auth';

let users = [
    { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { email: 'user@example.com', password: 'user123', role: 'user' }
];

let endpoints = [
    { path: '/api/posts', method: 'GET', response: { posts: [] } },
    { path: '/api/users', method: 'GET', response: { users: [] } }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Generate JWT secret on load
    document.getElementById('jwtSecret').value = generateJWTSecret();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check authentication
    checkAuth();
    
    // Load saved state
    loadSavedState();
    
    // Auto-load users from backend (DISABLED - no auto-refresh)
    // loadUsersFromBackend(false);
    
    // Check for new signups and refresh users (DISABLED - no auto-refresh)
    // checkForNewSignups();
    
    // Check authentication status on load (DISABLED - no auto-refresh)
    // updateAuthStatus();
});

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', (e) => loadPreset(e.target.dataset.preset));
    });
    
    // Generate config button
    const generateBtn = document.querySelector('[data-action="generate"]');
    if (generateBtn) generateBtn.addEventListener('click', generateConfig);
    
    // Export config button
    const exportBtn = document.querySelector('[data-action="export"]');
    if (exportBtn) exportBtn.addEventListener('click', exportConfig);
    
    // Dashboard button
    const dashboardBtn = document.querySelector('[data-action="dashboard"]');
    if (dashboardBtn) dashboardBtn.addEventListener('click', goToDashboard);
    
    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Add user button
    const addUserBtn = document.querySelector('[data-action="add-user"]');
    if (addUserBtn) addUserBtn.addEventListener('click', addUser);
    
    // Add endpoint button
    const addEndpointBtn = document.querySelector('[data-action="add-endpoint"]');
    if (addEndpointBtn) addEndpointBtn.addEventListener('click', addEndpoint);
    
    // Config action buttons
    const copyBtn = document.querySelector('[data-action="copy"]');
    if (copyBtn) copyBtn.addEventListener('click', copyConfig);
    
    const validateBtn = document.querySelector('[data-action="validate"]');
    if (validateBtn) validateBtn.addEventListener('click', validateConfig);
    
    const saveBtn = document.querySelector('[data-action="save"]');
    if (saveBtn) saveBtn.addEventListener('click', saveConfig);
    
    // Sync users button
    const syncUsersBtn = document.querySelector('[data-action="sync-users"]');
    if (syncUsersBtn) syncUsersBtn.addEventListener('click', syncUsersToBackend);
    
    // Load users button
    const loadUsersBtn = document.querySelector('[data-action="load-users"]');
    if (loadUsersBtn) loadUsersBtn.addEventListener('click', loadUsersFromBackend);
    
    
    // Auto-save on input changes
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('change', autoSave);
    });
}

// User list event delegation
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-action="remove-user"]')) {
        const index = parseInt(e.target.dataset.index);
        removeUser(index);
    }
    
    if (e.target.matches('[data-action="remove-endpoint"]')) {
        const index = parseInt(e.target.dataset.index);
        removeEndpoint(index);
    }
});

function generateJWTSecret() {
    // Generate a secure 32+ character JWT secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_!@#$%^&*';
    let secret = '';
    
    // Generate 48 random characters to ensure strong security
    for (let i = 0; i < 48; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return secret;
}

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Add active class to clicked tab
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

function addUser() {
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    
    if (!email || !password) {
        showNotification('Please fill in all user fields', 'error');
        return;
    }
    
    users.push({ email, password, role });
    
    // Clear inputs
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = 'user';
    
    renderUserList();
    autoSave();
    showNotification('User added successfully!', 'success');
}

async function removeUser(index) {
    const userToRemove = users[index];
    
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete user "${userToRemove.email}"? This will permanently delete them from the backend.`)) {
        return;
    }
    
    try {
        // Check authentication status
        if (!checkAuthStatus()) {
            return;
        }
        
        // Get auth token
        let token = localStorage.getItem('mockauth-access-token');
        
        // Try to delete from backend
        let response = await fetch(`/api/builder/users/${userToRemove.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Check if response is ok, if not, just remove locally
        if (!response.ok) {
            console.warn('Backend not available, removing user locally only');
            showNotification('⚠️ Backend not available, removed locally only', 'warning');
            return;
        }
        
        let data = await response.json();
        
        // If token is invalid, try to refresh it
        if (!data.success && (data.error === 'Invalid token' || data.error === 'No token provided')) {
            const refreshToken = localStorage.getItem('mockauth-refresh-token');
            if (refreshToken) {
                try {
                    const refreshResponse = await fetch('/auth/refresh', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ refreshToken })
                    });
                    
                    const refreshData = await refreshResponse.json();
                    if (refreshData.success) {
                        // Update tokens
                        localStorage.setItem('mockauth-access-token', refreshData.data.token);
                        if (refreshData.data.refreshToken) {
                            localStorage.setItem('mockauth-refresh-token', refreshData.data.refreshToken);
                        }
                        
                        // Retry deletion with new token
                        response = await fetch(`/api/builder/users/${userToRemove.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${refreshData.data.token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        data = await response.json();
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    showNotification('❌ Session expired. Please login again.', 'error');
                    return;
                }
            } else {
                showNotification('❌ Session expired. Please login again.', 'error');
                return;
            }
        }
        
        if (data.success) {
            // Remove from local array
            users.splice(index, 1);
            renderUserList();
            autoSave();
            showNotification(`✅ User "${userToRemove.email}" deleted from backend`, 'success');
        } else {
            if (data.error === 'Invalid token' || data.error === 'No token provided' || data.error === 'Admin access required') {
                handleAuthError(data.error);
            } else {
                showNotification(`❌ Failed to delete user: ${data.error}`, 'error');
            }
        }
    } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification('❌ Failed to connect to backend', 'error');
    }
}

function renderUserList() {
    const userList = document.getElementById('userList');
    
    if (users.length === 0) {
        userList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #64748b; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1;">
                <p>No users found. Add users using the form above or load from backend.</p>
            </div>
        `;
        return;
    }
    
    userList.innerHTML = users.map((user, index) => {
        // Check if this is a recently added user
        const isNewUser = user.isNew || false;
        const newUserBadge = isNewUser ? '<span class="new-user-badge" style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">NEW</span>' : '';
        
        return `
            <div class="user-item ${isNewUser ? 'new-user' : ''}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px;">
                <div>
                    <span style="font-weight: 500; color: #374151;">${user.email}</span>
                    <span style="color: #6b7280; margin-left: 8px;">(${user.role})</span>
                    ${newUserBadge}
                </div>
                <button class="remove-user" data-action="remove-user" data-index="${index}" title="Permanently delete user from backend" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.875rem;">🗑️ Delete</button>
            </div>
        `;
    }).join('');
}

function addEndpoint() {
    const path = document.getElementById('endpointPath').value;
    const method = document.getElementById('endpointMethod').value;
    let response = document.getElementById('endpointResponse').value;
    
    if (!path) {
        showNotification('Please enter an endpoint path', 'error');
        return;
    }
    
    try {
        response = response ? JSON.parse(response) : {};
    } catch (e) {
        showNotification('Invalid JSON response', 'error');
        return;
    }
    
    endpoints.push({ path, method, response });
    
    // Clear inputs
    document.getElementById('endpointPath').value = '';
    document.getElementById('endpointResponse').value = '';
    
    renderEndpointList();
    autoSave();
    showNotification('Endpoint added successfully!', 'success');
}

function removeEndpoint(index) {
    endpoints.splice(index, 1);
    renderEndpointList();
    autoSave();
    showNotification('Endpoint removed', 'success');
}

function renderEndpointList() {
    const endpointList = document.getElementById('endpointList');
    endpointList.innerHTML = endpoints.map((endpoint, index) => `
        <div class="endpoint-item">
            <span><span class="status-indicator status-enabled"></span>${endpoint.method} ${endpoint.path}</span>
            <button class="remove-user" data-action="remove-endpoint" data-index="${index}">Remove</button>
        </div>
    `).join('');
}

function generateConfig() {
    const port = document.getElementById('port').value;
    const jwtSecret = document.getElementById('jwtSecret').value;
    const enableMFA = document.getElementById('enableMFA').checked;
    const enablePasswordReset = document.getElementById('enablePasswordReset').checked;
    const enableAccountLockout = document.getElementById('enableAccountLockout').checked;
    const maxLoginAttempts = document.getElementById('maxLoginAttempts').value;
    const databaseType = document.getElementById('databaseType').value;
    const enableMockTail = document.getElementById('enableMockTail').checked;
    const enableSchemaGhost = document.getElementById('enableSchemaGhost').checked;
    
    const config = {
        port: parseInt(port),
        jwtSecret: jwtSecret,
        features: {
            mfa: enableMFA,
            passwordReset: enablePasswordReset,
            accountLockout: enableAccountLockout,
            maxLoginAttempts: parseInt(maxLoginAttempts)
        },
        database: {
            type: databaseType
        },
        users: users,
        endpoints: endpoints,
        integrations: {
            mockTail: enableMockTail,
            schemaGhost: enableSchemaGhost
        }
    };
    
    const configOutput = document.getElementById('configOutput');
    configOutput.textContent = JSON.stringify(config, null, 2);
    
    // Switch to config tab
    switchTab('config');
    
    showNotification('Configuration generated successfully!', 'success');
}

function exportConfig() {
    const configOutput = document.getElementById('configOutput').textContent;
    if (configOutput === 'Click "Generate Configuration" to see the output') {
        showNotification('Please generate configuration first', 'error');
        return;
    }
    
    const blob = new Blob([configOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mockauth-config.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Configuration exported!', 'success');
}

function copyConfig() {
    const configOutput = document.getElementById('configOutput').textContent;
    if (configOutput === 'Click "Generate Configuration" to see the output') {
        showNotification('Please generate configuration first', 'error');
        return;
    }
    
    navigator.clipboard.writeText(configOutput).then(() => {
        showNotification('Configuration copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy configuration', 'error');
    });
}

function validateConfig() {
    const configOutput = document.getElementById('configOutput').textContent;
    if (configOutput === 'Click "Generate Configuration" to see the output') {
        showNotification('Please generate configuration first', 'error');
        return;
    }
    
    try {
        JSON.parse(configOutput);
        showNotification('Configuration is valid!', 'success');
    } catch (error) {
        showNotification('Configuration validation failed', 'error');
    }
}

async function saveConfig() {
    const configOutput = document.getElementById('configOutput').textContent;
    if (configOutput === 'Click "Generate Configuration" to see the output') {
        showNotification('Please generate configuration first', 'error');
        return;
    }
    
    try {
        // Save to backend
        const response = await fetch('/api/builder/config/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: configOutput
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('mockauth-config', configOutput);
            showNotification('Configuration saved to server!', 'success');
            
            // Also sync users to the backend
            await syncUsersToBackend();
        } else {
            showNotification('Failed to save configuration', 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        // Fallback to localStorage
        localStorage.setItem('mockauth-config', configOutput);
        showNotification('Configuration saved locally', 'success');
    }
}

function loadPreset(preset) {
    const presets = {
        basic: {
            enableMFA: false,
            enablePasswordReset: true,
            enableAccountLockout: true,
            maxLoginAttempts: 3,
            databaseType: 'memory',
            enableMockTail: false,
            enableSchemaGhost: false
        },
        enterprise: {
            enableMFA: true,
            enablePasswordReset: true,
            enableAccountLockout: true,
            maxLoginAttempts: 5,
            databaseType: 'postgresql',
            enableMockTail: true,
            enableSchemaGhost: true
        },
        development: {
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
        document.getElementById('enableMFA').checked = config.enableMFA;
        document.getElementById('enablePasswordReset').checked = config.enablePasswordReset;
        document.getElementById('enableAccountLockout').checked = config.enableAccountLockout;
        document.getElementById('maxLoginAttempts').value = config.maxLoginAttempts;
        document.getElementById('databaseType').value = config.databaseType;
        document.getElementById('enableMockTail').checked = config.enableMockTail;
        document.getElementById('enableSchemaGhost').checked = config.enableSchemaGhost;
        
        showNotification(`${preset.charAt(0).toUpperCase() + preset.slice(1)} preset loaded!`, 'success');
    }
}

function autoSave() {
    const config = {
        port: document.getElementById('port').value,
        jwtSecret: document.getElementById('jwtSecret').value,
        enableMFA: document.getElementById('enableMFA').checked,
        enablePasswordReset: document.getElementById('enablePasswordReset').checked,
        enableAccountLockout: document.getElementById('enableAccountLockout').checked,
        maxLoginAttempts: document.getElementById('maxLoginAttempts').value,
        databaseType: document.getElementById('databaseType').value,
        enableMockTail: document.getElementById('enableMockTail').checked,
        enableSchemaGhost: document.getElementById('enableSchemaGhost').checked,
        users: users,
        endpoints: endpoints
    };
    localStorage.setItem('mockauth-builder-state', JSON.stringify(config));
}

function loadSavedState() {
    const saved = localStorage.getItem('mockauth-builder-state');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            
            document.getElementById('port').value = config.port || 3001;
            document.getElementById('jwtSecret').value = config.jwtSecret || generateJWTSecret();
            document.getElementById('enableMFA').checked = config.enableMFA || false;
            document.getElementById('enablePasswordReset').checked = config.enablePasswordReset !== false;
            document.getElementById('enableAccountLockout').checked = config.enableAccountLockout !== false;
            document.getElementById('maxLoginAttempts').value = config.maxLoginAttempts || 3;
            document.getElementById('databaseType').value = config.databaseType || 'memory';
            document.getElementById('enableMockTail').checked = config.enableMockTail || false;
            document.getElementById('enableSchemaGhost').checked = config.enableSchemaGhost || false;
            
            if (config.users) users = config.users;
            if (config.endpoints) endpoints = config.endpoints;
            
            renderUserList();
            renderEndpointList();
            showNotification('Previous configuration restored', 'success');
        } catch (error) {
            console.error('Failed to load saved state:', error);
        }
    }
}

let currentUser = null;

async function checkAuth() {
    // DISABLED - no auto-refresh, no auth checks
    console.log('Auth check disabled - Visual Builder works in configuration mode');
    return;
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

async function syncUsersToBackend() {
    if (users.length === 0) {
        showNotification('No users to sync', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/builder/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const created = data.data.created;
            const failed = data.data.errors;
            const alreadyExist = data.data.details.filter(d => d.error.includes('already exists')).length;
            
            if (created > 0) {
                showNotification(`✅ Created ${created} new user(s)!`, 'success');
            } else if (alreadyExist > 0) {
                showNotification(`ℹ️ All ${alreadyExist} user(s) already exist in backend`, 'success');
            } else if (failed > 0) {
                showNotification(`⚠️ ${failed} user(s) failed to sync`, 'error');
                console.warn('Sync errors:', data.data.details);
            }
        }
    } catch (error) {
        console.error('Failed to sync users:', error);
        showNotification('Failed to connect to backend', 'error');
    }
}

async function loadUsersFromBackend(showNotification = true) {
    try {
        const response = await fetch('/api/builder/users');
        
        // Check if response is ok, if not, don't retry
        if (!response.ok) {
            console.warn('Backend not available, using local users only');
            if (showNotification) {
                showNotification('⚠️ Backend not available, using local configuration', 'warning');
            }
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            // Clear current users and load from backend
            users = data.data.map(u => ({
                id: u.id, // Include user ID for deletion
                email: u.email,
                password: '••••••••', // Don't show real passwords
                role: u.roles && u.roles.length > 0 ? u.roles[0] : 'user',
                isNew: u.createdAt && (Date.now() - new Date(u.createdAt).getTime()) < 5 * 60 * 1000 // Mark as new if created within last 5 minutes
            }));
            
            renderUserList();
            if (showNotification) {
                showNotification(`✅ Loaded ${users.length} user(s) from backend`, 'success');
            }
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        if (showNotification) {
            showNotification('⚠️ Backend not available, using local configuration', 'warning');
        }
    }
}

async function testAPIConnection() {
    try {
        const response = await fetch('/api/builder/test');
        const data = await response.json();
        
        if (data.success) {
            showNotification('API connection verified!', 'success');
            return true;
        }
    } catch (error) {
        console.error('API connection failed:', error);
        showNotification('Warning: Backend API not reachable', 'error');
        return false;
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

// Function to refresh builder users (called from signup page)
function refreshBuilderUsers() {
    console.log('🔄 Refreshing builder users due to new signup...');
    loadUsersFromBackend();
}

// Check for new signups and refresh users automatically
function checkForNewSignups() {
    const newSignupData = localStorage.getItem('mockauth-new-signup');
    if (newSignupData) {
        try {
            const signupInfo = JSON.parse(newSignupData);
            const timeDiff = Date.now() - signupInfo.timestamp;
            
            // If signup was within the last 5 minutes, refresh users
            if (timeDiff < 5 * 60 * 1000) {
                console.log('🆕 New signup detected, refreshing users...');
                loadUsersFromBackend();
                showNotification(`✅ New user added: ${signupInfo.user.email}`, 'success');
            }
            
            // Clear the signup flag
            localStorage.removeItem('mockauth-new-signup');
        } catch (error) {
            console.error('Error processing new signup data:', error);
        }
    }
}

// Auto-refresh users every 30 seconds to catch new signups (DISABLED - no auto-refresh)
// setInterval(() => {
//     if (document.visibilityState === 'visible') {
//         checkForNewSignups();
//     }
// }, 30000);

// Helper function to check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('mockauth-access-token');
    if (!token) {
        showNotification('❌ Not authenticated. Please login to manage users.', 'error');
        return false;
    }
    return true;
}

// Helper function to handle authentication errors
function handleAuthError(error) {
    if (error === 'Invalid token' || error === 'No token provided') {
        showNotification('❌ Session expired. Please login again.', 'error');
        // Optionally redirect to login
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    } else {
        showNotification(`❌ Authentication error: ${error}`, 'error');
    }
}

// Update authentication status display
function updateAuthStatus() {
    const token = localStorage.getItem('mockauth-access-token');
    const user = localStorage.getItem('mockauth-user');
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            console.log(`✅ Authenticated as: ${userData.email}`);
        } catch (error) {
            console.log('❌ Invalid user data in localStorage');
        }
    } else {
        console.log('❌ Not authenticated');
    }
}

// Navigate to dashboard
function goToDashboard() {
    window.location.href = '/dashboard';
}

