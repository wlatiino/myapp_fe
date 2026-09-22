import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Proxy /api ke backend Go. VITE_PROXY_TARGET bisa di-set (mis. dari dalam
// docker ke tokoapp-backend:3000); default menunjuk host (3001 = docker
// backend, atau 3000 = `go run .` manual).
const proxyTarget =
  process.env.VITE_PROXY_TARGET ||
  `http://127.0.0.1:${process.env.VITE_PROXY_PORT || 3001}`

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5002,
    proxy: {
      '/api': { target: proxyTarget, changeOrigin: true },
    },
  },
})