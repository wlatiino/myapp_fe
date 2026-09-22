<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { login } from '../api'
import { loadMe, clearAuth } from '../store/auth'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    await login(email.value.trim(), password.value)
    await loadMe()
    router.replace(route.query.redirect || '/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Gagal masuk. Periksa email dan password.'
  } finally {
    loading.value = false
  }
}

clearAuth()
</script>

<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-logo">
        <i class="pi pi-store" />
        <span>TokoApp</span>
      </div>
      <p class="login-subtitle">Masuk untuk melanjutkan</p>

      <form class="login-form" @submit.prevent="submit">
        <div class="p-field">
          <label for="email">Email</label>
          <InputText id="email" v-model="email" type="email" autocomplete="username" fluid />
        </div>
        <div class="p-field">
          <label for="password">Password</label>
          <Password id="password" v-model="password" :feedback="false" toggleMask autocomplete="current-password" fluid />
        </div>

        <p v-if="error" class="login-error">{{ error }}</p>

        <Button type="submit" label="Masuk" icon="pi pi-sign-in" :loading="loading" fluid />
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-surface-100);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-200);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--p-primary-color);
}

.login-logo .pi {
  font-size: 1.6rem;
}

.login-subtitle {
  margin: 0.35rem 0 1.5rem;
  color: var(--p-surface-500);
  font-size: 0.9rem;
}

.login-form .p-field {
  margin-bottom: 1rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.login-error {
  margin: 0.25rem 0 1rem;
  color: var(--p-red-600);
  font-size: 0.85rem;
}
</style>