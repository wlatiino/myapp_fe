<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import api from '../api'
import { hasPerm } from '../store/auth'
import TransactionEditor from '../components/TransactionEditor.vue'

const MENU = 'PURCHASE'

const rows = ref([])
const products = ref([])
const partners = ref([])
const loading = ref(false)

const editorVisible = ref(false)
const editingId = ref(null)

const detailVisible = ref(false)
const detail = ref(null)
const detailLoading = ref(false)
const detailError = ref('')

const partnerMap = computed(() =>
  Object.fromEntries(partners.value.map((p) => [p.id, p.name])),
)

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

async function load() {
  loading.value = true
  try {
    const [purch, prods, parts] = await Promise.all([
      api.get('/purchases'),
      api.get('/products'),
      api.get('/partners'),
    ])
    rows.value = purch.data?.data ?? []
    products.value = prods.data?.data ?? []
    partners.value = parts.data?.data ?? []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  editorVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  editorVisible.value = true
}

async function showDetail(row) {
  detail.value = null
  detailError.value = ''
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await api.get(`/purchases/${row.id}`)
    detail.value = res.data?.data
  } catch (e) {
    detailError.value = e.response?.data?.error || e.message
  } finally {
    detailLoading.value = false
  }
}

async function doVoid(row) {
  if (!confirm(`Void pembelian "${row.no}"?`)) return
  try {
    await api.post(`/purchases/${row.id}/void`)
    await load()
  } catch (e) {
    alert(e.response?.data?.error || e.message || 'Gagal void')
  }
}

async function remove(row) {
  if (!confirm(`Hapus pembelian "${row.no}"?`)) return
  try {
    await api.delete(`/purchases/${row.id}`)
    await load()
  } catch (e) {
    alert(e.response?.data?.error || e.message || 'Gagal menghapus')
  }
}

function fmtDate(v) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('id-ID')
}

onMounted(load)
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: space-between">
    <div>
      <h1 class="page-title">Pembelian</h1>
      <p class="page-subtitle">Transaksi pembelian (PO)</p>
    </div>
    <Button v-if="hasPerm(MENU, 'A')" label="Buat Pembelian" icon="pi pi-plus" @click="openCreate" />
  </div>

  <div class="p-card">
    <DataTable
      :value="rows"
      :loading="loading"
      stripedRows
      size="small"
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
    >
      <Column field="no" header="No. Dokumen" />
      <Column header="Tanggal" style="width: 110px">
        <template #body="{ data }">{{ fmtDate(data.transaction_date) }}</template>
      </Column>
      <Column header="Pemasok">
        <template #body="{ data }">
          {{ data.partner_id ? partnerMap[data.partner_id] || '—' : 'Umum' }}
        </template>
      </Column>
      <Column header="Total" style="width: 130px">
        <template #body="{ data }">
          <div class="text-right" style="font-weight: 600">{{ idr.format(data.total) }}</div>
        </template>
      </Column>
      <Column header="Status" style="width: 100px">
        <template #body="{ data }">
          <Tag :severity="data.status === 'ACTIVE' ? 'success' : 'secondary'" :value="data.status" />
        </template>
      </Column>
      <Column field="remark" header="Catatan" />
      <Column header="Aksi" style="width: 200px">
        <template #body="{ data }">
          <div style="display: flex; gap: 0.35rem">
            <Button icon="pi pi-eye" severity="secondary" rounded text size="small" @click="showDetail(data)" title="Detail" />
            <Button v-if="hasPerm(MENU, 'E')" icon="pi pi-pencil" severity="secondary" rounded text size="small" @click="openEdit(data)" title="Edit header" />
            <Button
              v-if="data.status === 'ACTIVE' && hasPerm(MENU, 'E')"
              icon="pi pi-ban"
              severity="warn"
              rounded text
              size="small"
              @click="doVoid(data)"
              title="Void"
            />
            <Button v-if="hasPerm(MENU, 'D')" icon="pi pi-trash" severity="danger" rounded text size="small" @click="remove(data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <TransactionEditor
    v-model:visible="editorVisible"
    mode="purchase"
    title="Pembelian"
    :editing-id="editingId"
    :products="products"
    :partners="partners"
    @saved="load"
  />

  <Dialog
    v-model:visible="detailVisible"
    header="Detail Pembelian"
    :style="{ width: '720px' }"
    modal
  >
    <div v-if="detailError" style="color: var(--p-red-600)">{{ detailError }}</div>
    <div v-if="detail">
      <div style="display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 1rem">
        <div>
          <div style="font-size: 0.8rem; color: var(--p-surface-500)">No. Dokumen</div>
          <b>{{ detail.no }}</b>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--p-surface-500)">Tanggal</div>
          <b>{{ fmtDate(detail.transaction_date) }}</b>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--p-surface-500)">Pemasok</div>
          <b>{{ detail.partner_id ? partnerMap[detail.partner_id] : 'Umum' }}</b>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: var(--p-surface-500)">Status</div>
          <Tag :severity="detail.status === 'ACTIVE' ? 'success' : 'secondary'" :value="detail.status" />
        </div>
      </div>
      <div v-if="detail.remark" class="mb-2" style="font-size: 0.9rem">Catatan: {{ detail.remark }}</div>
      <DataTable :value="detail.items" size="small" :loading="detailLoading">
        <Column header="Produk">
          <template #body="{ data }">
            {{ products.find((p) => p.id === data.product_id)?.name ?? `Produk #${data.product_id}` }}
          </template>
        </Column>
        <Column field="qty" header="Qty" style="width: 90px" />
        <Column header="Harga" style="width: 130px">
          <template #body="{ data }">{{ idr.format(data.price) }}</template>
        </Column>
        <Column header="Subtotal" style="width: 130px">
          <template #body="{ data }">
            <div class="text-right" style="font-weight: 600">{{ idr.format(data.total) }}</div>
          </template>
        </Column>
      </DataTable>
      <div class="text-right" style="margin-top: 1rem; font-size: 1.1rem; font-weight: 700">
        Total: {{ idr.format(detail.total) }}
      </div>
    </div>
  </Dialog>
</template>