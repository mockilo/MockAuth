import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { MockAuthPlugin } from 'mockauth/components/vue/MockAuthPlugin'

const mockAuthConfig = {
  baseUrl: 'http://localhost:3001',
  autoRefresh: true,
  refreshInterval: 300000 // 5 minutes
}

const app = createApp(App)

app.use(router)
app.use(MockAuthPlugin, mockAuthConfig)

app.mount('#app')
