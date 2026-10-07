<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import DatePicker from 'primevue/datepicker'
import DataListView from '../components/DataListView.vue'
import { hasPerm } from '../store/auth'
import api from '../api'

const MENU = 'STOCK'

const list = ref(null)
const dialogVisible = ref(false)
const saving = ref(false)
const error = ref('')
const products = ref([])

const moveTypeOptions = [
  { label: 'AJI - Adjustment In (Masuk)', value: 'AJI' },
  { label: 'AJO - Adjustment Out (Keluar)', value: 'AJO' },
]

const emptyForm = () => ({
  product_id: null,
  move_type: 'AJI',
  move_date: new Date(),
  qty: 1,
  remark: '',
})

const form = ref(emptyForm())

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function fmtYMD(d) {
  return d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ''
}

async function loadProducts() {
  try {
    // GET list dipaginasi backend (default limit 10) — Select butuh semuanya
    const res = await api.get('/products', { params: { limit: 1000 } })
    products.value = (res.data?.data ?? []).map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.id }))
  } catch {
    products.value = []
  }
}

async function load() {
  list.value?.reload()
  await loadProducts()
}

function openAdjust() {
  form.value = emptyForm()
  error.value = ''
  dialogVisible.value = true
}

async function save() {
  if (!form.value.product_id) {
    error.value = 'Produk wajib dipilih'
    return
  }
  if (!form.value.qty || form.value.qty <= 0) {
    error.value = 'Qty harus > 0'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload = {
      product_id: form.value.product_id,
      move_type: form.value.move_type,
      qty: Number(form.value.qty),
      move_date: fmtYMD(form.value.move_date),
      remark: form.value.remark.trim(),
    }
    await api.post('/stock-movements', payload)
    dialogVisible.value = false
    await load()
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await load()
})

const productMap = computed(() => {
  const map = {}
  // keep from loaded products names? we don't have full list here; but list from DataListView is products
  return map
})
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: space-between">
    <div>
      <h1 class="page-title">Stok</h1>
      <p class="page-subtitle">Kartu stok & penyesuaian</p>
    </div>
    <Button v-if="hasPerm(MENU, 'A')" label="Penyesuaian Stok" icon="pi pi-pencil" @click="openAdjust" />
  </div>

  <DataListView ref="list" resource="products">
    <Column field="sku" header="SKU" sortable style="width: 120px" />
    <Column field="name" header="Nama Produk" sortable />
    <Column field="category" header="Kategori" sortable style="width: 120px" />
    <Column field="unit" header="Satuan" sortable style="width: 90px" />
    <Column field="qty" header="Qty Stok" sortable style="width: 110px">
      <template #body="{ data }">
        <div class="text-right"><b>{{ data.qty }}</b></div>
      </template>
    </Column>
    <Column field="avg_cost" header="Avg Cost" sortable style="width: 130px">
      <template #body="{ data }">
        <div class="text-right">{{ idr.format(data.avg_cost) }}</div>
      </template>
    </Column>
    <Column header="Nilai Stok" sortable style="width: 140px">
      <template #body="{ data }">
        <div class="text-right">{{ idr.format(data.qty * data.avg_cost) }}</div>
      </template>
    </Column>
    <Column field="active" header="Status" sortable style="width: 100px">
      <template #body="{ data }">
        <Tag :severity="data.active ? 'success' : 'secondary'" :value="data.active ? 'Aktif' : 'Nonaktif'" />
      </template>
    </Column>
  </DataListView>

  <Dialog
    v-model:visible="dialogVisible"
    header="Penyesuaian Stok (Adjustment)"
    :style="{ width: '480px' }"
    modal
  >
    <form @submit.prevent="save">
      <div class="dialog-form">
        <div class="p-field">
          <label for="product">Produk *</label>
          <Select
            id="product"
            v-model="form.product_id"
            :options="products"
            optionLabel="label"
            optionValue="value"
            placeholder="Pilih produk"
            filter
            fluid
          />
        </div>
        <div class="p-field">
          <label for="move_type">Tipe Pergerakan *</label>
          <Select id="move_type" v-model="form.move_type" :options="moveTypeOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <div class="p-field">
          <label for="qty">Qty *</label>
          <InputNumber id="qty" v-model="form.qty" :min="1" fluid />
        </div>
        <div class="p-field">
          <label for="move_date">Tanggal</label>
          <DatePicker id="move_date" v-model="form.move_date" showIcon dateFormat="dd/mm/yy" fluid />
        </div>
        <div class="p-field">
          <label for="remark">Keterangan</label>
          <InputText id="remark" v-model="form.remark" fluid />
        </div>
        <div v-if="error" style="color: var(--p-red-600); font-size: 0.875rem">{{ error }}</div>
      </div>
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem">
        <Button label="Batal" severity="secondary" @click="dialogVisible = false" :disabled="saving" type="button" />
        <Button label="Simpan" icon="pi pi-check" :loading="saving" type="submit" />
      </div>
    </form>
  </Dialog>
</template>
