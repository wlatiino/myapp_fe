<script setup>
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import api from '../api'
import DataListView from '../components/DataListView.vue'
import { hasPerm } from '../store/auth'

const MENU = 'SYSTEM_TYPES'

const CATEGORY_HINT = {
  MOVEMENT_TYPE: 'Tipe pergerakan stok (butuh sign +1 / -1)',
  TRANS_STATUS: 'Status transaksi',
  PERMISSION: 'Kode hak akses menu',
  USER_TYPE: 'Tipe user',
}

const signOptions = [
  { label: '+1 — Masuk / Tambah', value: 1 },
  { label: '-1 — Keluar / Kurang', value: -1 },
]

const list = ref(null)
const categories = ref([])
const category = ref(null)
const dialogVisible = ref(false)
const saving = ref(false)
const error = ref('')
const editingId = ref(null)

const emptyForm = () => ({
  category: '',
  code: '',
  name: '',
  sign: null,
  sort_order: 0,
  active: true,
})

const form = ref(emptyForm())

const extra = computed(() => ({ category: category.value ?? '' }))

const categoryOptions = computed(() => categories.value.map((c) => ({ label: c, value: c })))

// Sign hanya relevan untuk MOVEMENT_TYPE (lihat schema 006).
const showSign = computed(() => form.value.category.trim().toUpperCase() === 'MOVEMENT_TYPE')

// Daftar kategori diambil dari data yang ada agar opsi filter tidak
// perlu di-hardcode (kategori baru otomatis muncul setelah disimpan).
async function loadCategories() {
  try {
    // GET list dipaginasi backend (default limit 10) — kategori harus lengkap
    const res = await api.get('/system-types', { params: { limit: 1000 } })
    const set = new Set((res.data?.data ?? []).map((r) => r.category))
    categories.value = [...set].sort()
  } catch {
    categories.value = []
  }
}

function load() {
  list.value?.reload()
  loadCategories()
}

onMounted(loadCategories)

function openAdd() {
  editingId.value = null
  form.value = emptyForm()
  error.value = ''
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    category: row.category,
    code: row.code,
    name: row.name,
    sign: row.sign ?? null,
    sort_order: Number(row.sort_order),
    active: row.active,
  }
  error.value = ''
  dialogVisible.value = true
}

async function save() {
  const payload = {
    category: form.value.category.trim().toUpperCase(),
    code: form.value.code.trim().toUpperCase(),
    name: form.value.name.trim(),
    sign: showSign.value ? form.value.sign ?? null : null,
    sort_order: Number(form.value.sort_order) || 0,
    active: !!form.value.active,
  }
  if (!payload.category || !payload.code || !payload.name) {
    error.value = 'Kategori, kode, dan nama wajib diisi'
    return
  }
  saving.value = true
  error.value = ''
  try {
    if (editingId.value) {
      await api.put(`/system-types/${editingId.value}`, payload)
    } else {
      await api.post('/system-types', payload)
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (!confirm(`Hapus system type "${row.name}" (${row.category}/${row.code})?`)) return
  try {
    await api.delete(`/system-types/${row.id}`)
    load()
  } catch (e) {
    alert(e.response?.data?.error || e.message || 'Gagal menghapus')
  }
}

function fmtSign(v) {
  if (v === null || v === undefined) return '—'
  return v > 0 ? `+${v}` : `${v}`
}

function severityForCategory(c) {
  return (
    {
      MOVEMENT_TYPE: 'info',
      TRANS_STATUS: 'success',
      PERMISSION: 'warn',
      USER_TYPE: 'secondary',
    }[c] ?? 'secondary'
  )
}
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: space-between">
    <div>
      <h1 class="page-title">System Types</h1>
      <p class="page-subtitle">Kode &amp; nama nilai referensi sistem</p>
    </div>
  </div>

  <DataListView ref="list" resource="system-types" :extra="extra">
    <template #filters>
      <Select
        v-model="category"
        :options="categoryOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Semua kategori"
        showClear
        style="min-width: 220px"
      />
    </template>
    <template #actions>
      <Button v-if="hasPerm(MENU, 'A')" label="Tambah System Type" icon="pi pi-plus" @click="openAdd" />
    </template>

    <Column field="category" header="Kategori" sortable style="width: 170px">
      <template #body="{ data }">
        <Tag :severity="severityForCategory(data.category)" :value="data.category" />
      </template>
    </Column>
    <Column field="code" header="Kode" sortable style="width: 120px" />
    <Column field="name" header="Nama" sortable />
    <Column field="sign" header="Sign" sortable style="width: 90px">
      <template #body="{ data }">
        <div class="text-right">
          <template v-if="data.sign !== null && data.sign !== undefined">
            <Tag
              :severity="data.sign > 0 ? 'success' : 'danger'"
              :value="fmtSign(data.sign)"
              style="min-width: 2.5rem; justify-content: center"
            />
          </template>
          <span v-else style="color: var(--p-surface-400)">—</span>
        </div>
      </template>
    </Column>
    <Column field="sort_order" header="Urutan" sortable style="width: 90px">
      <template #body="{ data }">
        <div class="text-right">{{ data.sort_order }}</div>
      </template>
    </Column>
    <Column field="active" header="Status" sortable style="width: 100px">
      <template #body="{ data }">
        <Tag :severity="data.active ? 'success' : 'secondary'" :value="data.active ? 'Aktif' : 'Nonaktif'" />
      </template>
    </Column>
    <Column header="Aksi" style="width: 120px">
      <template #body="{ data }">
        <div style="display: flex; gap: 0.35rem">
          <Button v-if="hasPerm(MENU, 'E')" icon="pi pi-pencil" severity="secondary" rounded text size="small" @click="openEdit(data)" title="Edit" />
          <Button v-if="hasPerm(MENU, 'D')" icon="pi pi-trash" severity="danger" rounded text size="small" @click="remove(data)" title="Hapus" />
        </div>
      </template>
    </Column>
  </DataListView>

  <Dialog
    v-model:visible="dialogVisible"
    :header="editingId ? 'Edit System Type' : 'Tambah System Type'"
    :style="{ width: '520px' }"
    modal
  >
    <form @submit.prevent="save">
      <div class="dialog-form">
        <div class="p-field">
          <label for="st-category">Kategori *</label>
          <InputText id="st-category" v-model="form.category" list="st-category-list" placeholder="mis. MOVEMENT_TYPE" fluid />
          <datalist id="st-category-list">
            <option v-for="c in categories" :key="c" :value="c" />
          </datalist>
          <small v-if="CATEGORY_HINT[form.category.toUpperCase()]" style="color: var(--p-surface-500)">
            {{ CATEGORY_HINT[form.category.toUpperCase()] }}
          </small>
        </div>
        <div class="p-field">
          <label for="st-code">Kode *</label>
          <InputText id="st-code" v-model="form.code" placeholder="mis. IN" fluid />
        </div>
        <div class="p-field">
          <label for="st-name">Nama *</label>
          <InputText id="st-name" v-model="form.name" placeholder="mis. Stock In" fluid />
        </div>
        <div v-if="showSign" class="p-field">
          <label for="st-sign">Sign</label>
          <Select id="st-sign" v-model="form.sign" :options="signOptions" optionLabel="label" optionValue="value" placeholder="Tanpa sign" showClear fluid />
        </div>
        <div class="p-field">
          <label for="st-sort">Urutan</label>
          <InputNumber id="st-sort" v-model="form.sort_order" :min="0" :useGrouping="false" fluid />
        </div>
        <div class="p-field">
          <label for="st-active" style="display: flex; align-items: center; gap: 0.5rem">
            <input id="st-active" v-model="form.active" type="checkbox" />
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