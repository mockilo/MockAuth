<template>
  <div id="app">
    <header class="app-header">
      <h1>MockAuth Vue Example</h1>
      <MockAuthComponents :show-status="true" />
    </header>

    <main class="app-main">
      <div v-if="!isAuthenticated" class="auth-section">
        <div class="auth-tabs">
          <button 
            :class="{ active: showLogin }" 
            @click="showLogin = true; showRegister = false"
          >
            Login
          </button>
          <button 
            :class="{ active: showRegister }" 
            @click="showRegister = true; showLogin = false"
          >
            Register
          </button>
        </div>

        <MockAuthComponents 
          :show-login="showLogin"
          :show-register="showRegister"
          @login-success="showLogin = false"
          @register-success="showRegister = false"
        />

        <div class="demo-credentials">
          <h3>Demo Credentials</h3>
          <p><strong>Admin:</strong> admin@example.com / admin123</p>
          <p><strong>User:</strong> user@example.com / user123</p>
        </div>
      </div>

      <div v-else class="authenticated-section">
        <MockAuthComponents :show-profile="true" />
        
        <div class="user-info">
          <h3>User Information</h3>
          <p><strong>ID:</strong> {{ user?.id }}</p>
          <p><strong>Email:</strong> {{ user?.email }}</p>
          <p><strong>Username:</strong> {{ user?.username }}</p>
          <p><strong>Roles:</strong> {{ user?.roles.join(', ') }}</p>
          <p><strong>Permissions:</strong> {{ user?.permissions.join(', ') }}</p>
        </div>

        <div class="api-examples">
          <h3>API Examples</h3>
          <p>Try these API calls with your authentication token:</p>
          <pre>{{ apiExampleCode }}</pre>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>Powered by <a href="https://github.com/mockilo/mockauth" target="_blank" rel="noopener noreferrer">MockAuth</a></p>
    </footer>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useMockAuth } from 'mockauth/components/vue/MockAuthPlugin'
import MockAuthComponents from 'mockauth/components/vue/MockAuthComponents.vue'

export default {
  name: 'App',
  components: {
    MockAuthComponents
  },
  setup() {
    const mockAuth = useMockAuth()
    const showLogin = ref(false)
    const showRegister = ref(false)

    const user = computed(() => mockAuth.user.value)
    const isAuthenticated = computed(() => mockAuth.isAuthenticated.value)

    const apiExampleCode = computed(() => {
      if (!user.value) return ''
      return `// Get user profile
fetch('http://localhost:3001/users/${user.value.id}', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Get all users (admin only)
fetch('http://localhost:3001/users', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Health check
fetch('http://localhost:3001/health')`
    })

    return {
      user,
      isAuthenticated,
      showLogin,
      showRegister,
      apiExampleCode
    }
  }
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}

.app-header h1 {
  margin: 0 0 20px 0;
  font-size: 2.5rem;
}

.app-main {
  flex: 1;
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.auth-section {
  max-width: 500px;
  margin: 0 auto;
}

.auth-tabs {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
}

.auth-tabs button {
  flex: 1;
  padding: 15px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.auth-tabs button:hover {
  background-color: #f5f5f5;
}

.auth-tabs button.active {
  border-bottom-color: #007bff;
  color: #007bff;
  font-weight: 600;
}

.authenticated-section {
  text-align: left;
}

.user-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.user-info h3 {
  margin-top: 0;
  color: #495057;
}

.user-info p {
  margin: 10px 0;
  font-family: monospace;
}

.api-examples {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.api-examples h3 {
  margin-top: 0;
  color: #495057;
}

.api-examples pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  text-align: left;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.demo-credentials {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid #2196f3;
}

.demo-credentials h3 {
  margin-top: 0;
  color: #1976d2;
}

.demo-credentials p {
  margin: 8px 0;
  font-family: monospace;
  background: white;
  padding: 8px;
  border-radius: 4px;
}

.app-footer {
  background-color: #f8f9fa;
  padding: 20px;
  border-top: 1px solid #dee2e6;
}

.app-footer a {
  color: #007bff;
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-main {
    padding: 20px 15px;
  }
  
  .auth-tabs {
    flex-direction: column;
  }
  
  .auth-tabs button {
    border-bottom: 1px solid #ddd;
    border-right: none;
  }
  
  .auth-tabs button.active {
    border-bottom-color: #007bff;
    border-right: none;
  }
}
</style>
