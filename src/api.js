import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

const REFRESH_KEY = 'tokoapp_refresh_token'

let accessToken = null
let user = null
let refreshingPromise = null

export function getAccessToken() {
  return accessToken
}

export function getSessionUser() {
  return user
}

export function hasSession() {
  return !!accessToken || !!getRefreshToken()
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setSession(data) {
  accessToken = data.access_token
  user = data.user
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token)
}

export function clearSession() {
  accessToken = null
  user = null
  localStorage.removeItem(REFRESH_KEY)
}

export async function login(email, password) {
  const { data } = await api.post('/login', { email, password })
  setSession(data.data)
  return data.data
}

export async function logout() {
  try {
    await api.post('/logout')
  } catch {
    // stateless: cukup bersihkan client
  }
  clearSession()
}

async function refreshTokens() {
  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      const rt = getRefreshToken()
      if (!rt) throw new Error('tidak ada refresh token')
      const { data } = await api.post('/refresh', { refresh_token: rt })
      accessToken = data.data.access_token
      return accessToken
    })().finally(() => {
      refreshingPromise = null
    })
  }
  return refreshingPromise
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error
    const isAuthPath = config?.url?.includes('/login') || config?.url?.includes('/refresh')
    if (response?.status === 401 && config && !config._retry && !isAuthPath) {
      config._retry = true
      try {
        await refreshTokens()
        return api(config)
      } catch {
        clearSession()
        // Pemberitahuan lembut ke App untuk redirect — hindari full reload
        // yang bikin halaman berkedip.
        window.dispatchEvent(new CustomEvent('tokoapp:session-expired'))
      }
    }
    return Promise.reject(error)
  },
)

export { refreshTokens }

export default api