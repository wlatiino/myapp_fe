<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { auth, hasView, loadMe } from './store/auth'
import { logout } from './api'

const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.name === 'login')

// Pemetaan kode menu (tables menus) ke rute + ikon frontend.
// Menu yang belum punya halaman (berisi `path`) tetap diklik → rute
// placeholder dengan path UNIK agar tidak saling ter-highlight.
const menuMap = {
  USER: { to: '/users', icon: 'pi pi-user' },
  MENU: { to: '/menus', icon: 'pi pi-list' },
  USER_MENUS: { path: '/user-menus', icon: 'pi pi-lock' },
  SYSTEM_TYPES: { to: '/system-types', icon: 'pi pi-sliders-h' },
  PRODUCT: { to: '/products', icon: 'pi pi-box' },
  BISNIS_PARTNER: { to: '/partners', icon: 'pi pi-users' },
  SALES: { to: '/sales', icon: 'pi pi-shopping-cart' },
  PURCHASE: { to: '/purchases', icon: 'pi pi-truck' },
  STOCK: { to: '/stock', icon: 'pi pi-warehouse' },
  STOCK_MOVEMENT: { path: '/stock-movement', icon: 'pi pi-arrow-right-arrow-left' },
  INFO_SALES: { path: '/info-sales', icon: 'pi pi-chart-line' },
  INFO_PURCHASE: { path: '/info-purchase', icon: 'pi pi-chart-bar' },
}

const sidebarMenus = computed(() =>
  auth.menus.map((m) => {
    const page = menuMap[m.name] ?? {}
    return {
      name: m.name,
      label: m.label,
      to: page.to ?? { path: page.path ?? '/placeholder', query: { label: m.label } },
      icon: page.icon ?? 'pi pi-circle',
      disabled: !hasView(m.name),
    }
  }),
)

onMounted(async () => {
  if (!isLoginPage.value) {
    try {
      await loadMe()
    } catch {
      // interceptor axios sudah menangani 401 → event session-expired
    }
  }
  window.addEventListener('tokoapp:session-expired', onSessionExpired)
})

onUnmounted(() => {
  window.removeEventListener('tokoapp:session-expired', onSessionExpired)
})

function onSessionExpired() {
  if (route.name !== 'login') {
    router.replace({ name: 'login' })
  }
}

async function doLogout() {
  await logout()
  router.replace('/login')
}
</script>

<template>
  <div v-if="!isLoginPage" class="app-shell">
    <aside class="app-sidebar">
      <div class="app-logo">
        <i class="pi pi-store" style="margin-right: 0.5rem" />
        TokoApp
      </div>
      <nav>
        <router-link to="/" class="nav-link">
          <i class="pi pi-home" />
          <span>Dashboard</span>
        </router-link>
        <template v-for="m in sidebarMenus" :key="m.name">
          <router-link v-if="!m.disabled" :to="m.to" class="nav-link">
            <i :class="m.icon" />
            <span>{{ m.label }}</span>
          </router-link>
          <div v-else class="nav-link nav-disabled" :title="`${m.label}: tidak punya akses`">
            <i :class="m.icon" />
            <span>{{ m.label }}</span>
            <i class="pi pi-lock nav-lock" />
          </div>
        </template>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-name">{{ auth.user?.name || 'User' }}</div>
          <div class="sidebar-user-sub">{{ auth.user?.email || '' }}</div>
        </div>
        <Button icon="pi pi-sign-out" severity="secondary" rounded text size="small" @click="doLogout" title="Keluar" />
      </div>
    </aside>
    <main class="app-main">
      <router-view />
    </main>
  </div>
  <router-view v-else />
</template>