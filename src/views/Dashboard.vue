<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'

const stats = ref({
  products: 0,
  partners: 0,
  stockValue: 0,
})

onMounted(async () => {
  try {
    const [products, partners] = await Promise.all([
      // GET list dipaginasi backend (default limit 10); nilai stok butuh semua baris
      api.get('/products', { params: { limit: 1000 } }),
      api.get('/partners', { params: { limit: 1000 } }),
    ])
    const list = products.data?.data ?? []
    stats.value.products = Number(products.data?.total ?? list.length)
    stats.value.partners = Number(partners.data?.total ?? partners.data?.data?.length ?? 0)
    stats.value.stockValue = list.reduce((s, p) => s + p.qty * p.avg_cost, 0)
  } catch (e) {
    console.error(e)
  }
})

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const cards = [
  { label: 'Produk', icon: 'pi pi-box', key: 'products' },
  { label: 'Mitra Bisnis', icon: 'pi pi-users', key: 'partners' },
]
</script>

<template>
  <h1 class="page-title">Dashboard</h1>
  <p class="page-subtitle">Ringkasan tokoapp</p>

  <div style="display: flex; gap: 1rem; flex-wrap: wrap">
    <div
      class="p-card"
      v-for="c in cards"
      :key="c.key"
      style="flex: 1; min-width: 200px"
    >
      <div class="p-card-body" style="padding: 1.25rem">
        <div style="display: flex; align-items: center; gap: 0.75rem">
          <i :class="c.icon" style="font-size: 1.6rem; color: var(--p-primary-color)" />
          <div>
            <div style="font-size: 0.85rem; color: var(--p-surface-500)">{{ c.label }}</div>
            <div style="font-size: 1.6rem; font-weight: 700">{{ stats[c.key] }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="p-card" style="margin-top: 1rem; max-width: 400px">
    <div class="p-card-body" style="padding: 1.25rem">
      <div style="font-size: 0.85rem; color: var(--p-surface-500)">Nilai Stok (avg cost)</div>
      <div style="font-size: 1.6rem; font-weight: 700">{{ idr.format(stats.stockValue) }}</div>
    </div>
  </div>
</template>