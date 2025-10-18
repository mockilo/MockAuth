<template>
  <div class="mockauth-components">
    <!-- Login Form -->
    <div v-if="showLogin" class="mockauth-login-form">
      <h2>Login</h2>
      
      <div v-if="loginError" class="mockauth-error">
        {{ loginError }}
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="mockauth-field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="loginForm.email"
            type="email"
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="mockauth-field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            required
            :disabled="isLoading"
          />
        </div>
        
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>

    <!-- Register Form -->
    <div v-if="showRegister" class="mockauth-register-form">
      <h2>Register</h2>
      
      <div v-if="registerError" class="mockauth-error">
        {{ registerError }}
      </div>
      
      <form @submit.prevent="handleRegister">
        <div class="mockauth-field">
          <label for="reg-email">Email</label>
          <input
            id="reg-email"
            v-model="registerForm.email"
            type="email"
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="mockauth-field">
          <label for="reg-username">Username</label>
          <input
            id="reg-username"
            v-model="registerForm.username"
            type="text"
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="mockauth-field">
          <label for="reg-firstName">First Name</label>
          <input
            id="reg-firstName"
            v-model="registerForm.firstName"
            type="text"
            :disabled="isLoading"
          />
        </div>
        
        <div class="mockauth-field">
          <label for="reg-lastName">Last Name</label>
          <input
            id="reg-lastName"
            v-model="registerForm.lastName"
            type="text"
            :disabled="isLoading"
          />
        </div>
        
        <div class="mockauth-field">
          <label for="reg-password">Password</label>
          <input
            id="reg-password"
            v-model="registerForm.password"
            type="password"
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="mockauth-field">
          <label for="reg-confirmPassword">Confirm Password</label>
          <input
            id="reg-confirmPassword"
            v-model="registerForm.confirmPassword"
            type="password"
            required
            :disabled="isLoading"
          />
        </div>
        
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Registering...' : 'Register' }}
        </button>
      </form>
    </div>

    <!-- User Profile -->
    <div v-if="showProfile && user" class="mockauth-user-profile">
      <div class="mockauth-profile-header">
        <h3>Profile</h3>
        <button @click="handleLogout" class="mockauth-logout-btn">
          Logout
        </button>
      </div>
      
      <div class="mockauth-profile-info">
        <div class="mockauth-field">
          <label>Email</label>
          <span>{{ user.email }}</span>
        </div>
        
        <div class="mockauth-field">
          <label>Username</label>
          <span>{{ user.username }}</span>
        </div>
        
        <div class="mockauth-field">
          <label>Roles</label>
          <span>{{ user.roles.join(', ') }}</span>
        </div>
        
        <div v-if="!isEditing" class="mockauth-field">
          <label>First Name</label>
          <span>{{ user.profile?.firstName || 'Not set' }}</span>
        </div>
        
        <div v-if="!isEditing" class="mockauth-field">
          <label>Last Name</label>
          <span>{{ user.profile?.lastName || 'Not set' }}</span>
        </div>
        
        <div v-if="!isEditing && user.profile?.avatar" class="mockauth-field">
          <label>Avatar</label>
          <img :src="user.profile.avatar" alt="Avatar" class="mockauth-avatar" />
        </div>
        
        <!-- Edit Form -->
        <div v-if="isEditing">
          <div class="mockauth-field">
            <label for="edit-firstName">First Name</label>
            <input
              id="edit-firstName"
              v-model="editForm.firstName"
              type="text"
              :disabled="isLoading"
            />
          </div>
          
          <div class="mockauth-field">
            <label for="edit-lastName">Last Name</label>
            <input
              id="edit-lastName"
              v-model="editForm.lastName"
              type="text"
              :disabled="isLoading"
            />
          </div>
          
          <div class="mockauth-field">
            <label for="edit-avatar">Avatar URL</label>
            <input
              id="edit-avatar"
              v-model="editForm.avatar"
              type="url"
              :disabled="isLoading"
            />
          </div>
          
          <div class="mockauth-actions">
            <button @click="handleSaveProfile" :disabled="isLoading">
              {{ isLoading ? 'Saving...' : 'Save' }}
            </button>
            <button @click="cancelEdit" :disabled="isLoading">
              Cancel
            </button>
          </div>
        </div>
        
        <button v-if="!isEditing" @click="startEdit">
          Edit Profile
        </button>
      </div>
    </div>

    <!-- Auth Status -->
    <div v-if="showStatus" class="mockauth-status" :class="statusClass">
      <div v-if="isLoading">Loading...</div>
      <div v-else-if="!isAuthenticated">Not logged in</div>
      <div v-else>Welcome, {{ user?.profile?.firstName || user?.username }}!</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMockAuth } from './MockAuthPlugin';

// Props
interface Props {
  showLogin?: boolean;
  showRegister?: boolean;
  showProfile?: boolean;
  showStatus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogin: false,
  showRegister: false,
  showProfile: false,
  showStatus: false
});

// Emits
const emit = defineEmits<{
  loginSuccess: [];
  registerSuccess: [];
  logout: [];
}>();

// MockAuth service
const mockAuth = useMockAuth();

// Reactive data
const loginForm = ref({
  email: '',
  password: ''
});

const registerForm = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: ''
});

const editForm = ref({
  firstName: '',
  lastName: '',
  avatar: ''
});

const loginError = ref('');
const registerError = ref('');
const isEditing = ref(false);

// Computed properties
const user = computed(() => mockAuth.user.value);
const token = computed(() => mockAuth.token.value);
const isLoading = computed(() => mockAuth.isLoading.value);
const isAuthenticated = computed(() => mockAuth.isAuthenticated.value);

const statusClass = computed(() => {
  if (isLoading.value) return 'loading';
  if (!isAuthenticated.value) return 'not-authenticated';
  return 'authenticated';
});

// Methods
const handleLogin = async () => {
  loginError.value = '';
  const result = await mockAuth.login(loginForm.value.email, loginForm.value.password);
  
  if (result.success) {
    emit('loginSuccess');
    loginForm.value = { email: '', password: '' };
  } else {
    loginError.value = result.error || 'Login failed';
  }
};

const handleRegister = async () => {
  registerError.value = '';
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerError.value = 'Passwords do not match';
    return;
  }

  const result = await mockAuth.register({
    email: registerForm.value.email,
    username: registerForm.value.username,
    password: registerForm.value.password,
    firstName: registerForm.value.firstName,
    lastName: registerForm.value.lastName
  });
  
  if (result.success) {
    emit('registerSuccess');
    registerForm.value = {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    };
  } else {
    registerError.value = result.error || 'Registration failed';
  }
};

const handleLogout = async () => {
  await mockAuth.logout();
  emit('logout');
};

const startEdit = () => {
  if (user.value?.profile) {
    editForm.value = {
      firstName: user.value.profile.firstName || '',
      lastName: user.value.profile.lastName || '',
      avatar: user.value.profile.avatar || ''
    };
  }
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  editForm.value = { firstName: '', lastName: '', avatar: '' };
};

const handleSaveProfile = async () => {
  const success = await mockAuth.updateProfile(editForm.value);
  if (success) {
    isEditing.value = false;
  }
};

// Watch for user changes to reset forms
watch(user, (newUser) => {
  if (!newUser) {
    loginError.value = '';
    registerError.value = '';
    isEditing.value = false;
  }
});
</script>

<style scoped>
.mockauth-components {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mockauth-login-form,
.mockauth-register-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.mockauth-field {
  margin-bottom: 15px;
}

.mockauth-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.mockauth-field input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.mockauth-field input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.mockauth-error {
  background-color: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #fcc;
}

.mockauth-user-profile {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.mockauth-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.mockauth-logout-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.mockauth-profile-info .mockauth-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.mockauth-profile-info .mockauth-field:last-child {
  border-bottom: none;
}

.mockauth-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.mockauth-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.mockauth-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.mockauth-actions button:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.mockauth-status {
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.mockauth-status.loading {
  background-color: #e3f2fd;
  color: #1976d2;
}

.mockauth-status.not-authenticated {
  background-color: #fff3e0;
  color: #f57c00;
}

.mockauth-status.authenticated {
  background-color: #e8f5e8;
  color: #2e7d32;
}

button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background-color: #f5f5f5;
}

button:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
