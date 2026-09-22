<script setup>
import { onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import api from '../api'
import { hasPerm } from '../store/auth'

const MENU = 'PRODUCT'

const rows = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const error = ref('')
const editingId = ref(null)

const emptyForm = () => ({
  sku: '',
  name: '',
  category: '',
  unit: 'pcs',
  price_buy: 0,
  price_sell: 0,
  active: true,
})

const form = ref(emptyForm())

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

async function load() {
  loading.value = true
  try {
    const res = await api.get('/products')
    rows.value = res.data?.data ?? []
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingId.value = null
  form.value = emptyForm()
  error.value = ''
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    sku: row.sku,
    name: row.name,
    category: row.category ?? '',
    unit: row.unit,
    price_buy: Number(row.price_buy),
    price_sell: Number(row.price_sell),
    active: row.active,
  }
  error.value = ''
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (editingId.value) {
      await api.put(`/products/${editingId.value}`, form.value)
    } else {
      await api.post('/products', form.value)
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (!confirm(`Hapus produk "${row.name}"?`)) return
  try {
    await api.delete(`/products/${row.id}`)
    await load()
  } catch (e) {
    alert(e.response?.data?.error || e.message || 'Gagal menghapus')
  }
}

onMounted(load)
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: space-between">
    <div>
      <h1 class="page-title">Produk</h1>
      <p class="page-subtitle">Katalog produk & harga</p>
    </div>
    <Button v-if="hasPerm(MENU, 'A')" label="Tambah Produk" icon="pi pi-plus" @click="openAdd" />
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
      <Column field="sku" header="SKU" style="width: 120px" />
      <Column field="name" header="Nama" />
      <Column field="category" header="Kategori" />
      <Column field="unit" header="Satuan" style="width: 90px" />
      <Column header="Harga Beli" style="width: 130px">
        <template #body="{ data }">
          <div class="text-right">{{ idr.format(data.price_buy) }}</div>
        </template>
      </Column>
      <Column header="Harga Jual" style="width: 130px">
        <template #body="{ data }">
          <div class="text-right">{{ idr.format(data.price_sell) }}</div>
        </template>
      </Column>
      <Column header="Stok" style="width: 90px">
        <template #body="{ data }">
          <div class="text-right"><b>{{ data.qty }}</b></div>
        </template>
      </Column>
      <Column header="Status" style="width: 100px">
        <template #body="{ data }">
          <Tag :severity="data.active ? 'success' : 'secondary'" :value="data.active ? 'Aktif' : 'Nonaktif'" />
        </template>
      </Column>
      <Column header="Aksi" style="width: 140px">
        <template #body="{ data }">
          <div style="display: flex; gap: 0.35rem">
            <Button v-if="hasPerm(MENU, 'E')" icon="pi pi-pencil" severity="secondary" rounded text size="small" @click="openEdit(data)" />
            <Button v-if="hasPerm(MENU, 'D')" icon="pi pi-trash" severity="danger" rounded text size="small" @click="remove(data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="dialogVisible"
    :header="editingId ? 'Edit Produk' : 'Tambah Produk'"
    :style="{ width: '480px' }"
    modal
  >
    <form @submit.prevent="save">
      <div class="dialog-form">
        <div class="p-field">
          <label for="sku">SKU *</label>
          <InputText id="sku" v-model="form.sku" fluid />
        </div>
        <div class="p-field">
          <label for="name">Nama *</label>
          <InputText id="name" v-model="form.name" fluid />
        </div>
        <div class="p-field">
          <label for="category">Kategori</label>
          <InputText id="category" v-model="form.category" fluid />
        </div>
        <div class="p-field">
          <label for="unit">Satuan</label>
          <Select id="unit" v-model="form.unit" :options="['pcs', 'kg', 'ltr', 'box', 'pack']" fluid />
        </div>
        <div style="display: flex; gap: 1rem">
          <div class="p-field" style="flex: 1">
            <label for="price_buy">Harga Beli</label>
            <InputNumber id="price_buy" v-model="form.price_buy" mode="currency" currency="IDR" locale="id-ID" fluid :pt="{ input: { style: 'text-align: right' } }" />
          </div>
          <div class="p-field" style="flex: 1">
            <label for="price_sell">Harga Jual</label>
            <InputNumber id="price_sell" v-model="form.price_sell" mode="currency" currency="IDR" locale="id-ID" fluid :pt="{ input: { style: 'text-align: right' } }" />
          </div>
        </div>
        <div class="p-field">
          <label for="active" style="display: flex; align-items: center; gap: 0.5rem">
            <input id="active" v-model="form.active" type="checkbox" />
            Aktif
          </label>
        </div>
        <p v-if="error" style="color: var(--p-red-600); margin: 0; font-size: 0.85rem">{{ error }}</p>
      </div>
      <div class="dialog-footer">
        <Button type="button" label="Batal" severity="secondary" @click="dialogVisible = false" />
        <Button type="submit" label="Simpan" :loading="saving" />
      </div>
    </form>
  </Dialog>
</template>