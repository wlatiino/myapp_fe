import { reactive } from 'vue'
import api from '../api'

// Status sesi: user + daftar menu (dari /api/me) — di-*cached* di memori.
export const auth = reactive({
  user: null,
  menus: [],
})

export async function loadMe() {
  const res = await api.get('/me')
  auth.user = res.data?.data?.user ?? null
  auth.menus = res.data?.data?.menus ?? []
  return auth
}

export function hasPerm(menuName, code) {
  const m = auth.menus.find((x) => x.name === menuName)
  return !!m && m.permission.includes(code)
}

export function hasView(menuName) {
  return hasPerm(menuName, 'V')
}

export function clearAuth() {
  auth.user = null
  auth.menus = []
}