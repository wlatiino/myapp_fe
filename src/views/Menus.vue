<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import MultiSelect from 'primevue/multiselect'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import api from '../api'
import DataListView from '../components/DataListView.vue'
import { hasPerm } from '../store/auth'

const MENU = 'MENU'

const permOptions = [
  { label: 'V - Lihat', value: 'V' },
  { label: 'A - Tambah', value: 'A' },
  { label: 'E - Edit', value: 'E' },
  { label: 'D - Hapus', value: 'D' },
  { label: 'P - Cetak', value: 'P' },
  { label: 'X - Ekspor', value: 'X' },
]

const list = ref(null)
const dialogVisible = ref(false)
const saving = ref(false)
const error = ref('')
const editingId = ref(null)

const emptyForm = () => ({
  name: '',
  label: '',
  permission: [],
  back_date: 0,
  forward_date: 30,
  sort_order: 0,
  active: true,
})

const form = ref(emptyForm())

async function load() {
  list.value?.reload()
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
    name: row.name,
    label: row.label,
    permission: [...(row.permission ?? [])],
    back_date: Number(row.back_date),
    forward_date: Number(row.forward_date),
    sort_order: Number(row.sort_order),
    active: row.active,
  }
  error.value = ''
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const payload = {
      ...form.value,
      name: form.value.name.trim().toUpperCase(),
      label: form.value.label.trim(),
    }
    if (editingId.value) {
      await api.put(`/menus/${editingId.value}`, payload)
    } else {
      await api.post('/menus', payload)
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
  if (!confirm(`Hapus menu "${row.label}" (${row.name})?`)) return
  try {
    await api.delete(`/menus/${row.id}`)
    await load()
  } catch (e) {
    alert(e.response?.data?.error || e.message || 'Gagal menghapus')
  }
}
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: space-between">
    <div>
      <h1 class="page-title">Menu</h1>
      <p class="page-subtitle">Daftar menu aplikasi & template hak akses</p>
    </div>
  </div>

  <DataListView ref="list" resource="menus">
    <template #actions>
      <Button v-if="hasPerm(MENU, 'A')" label="Tambah Menu" icon="pi pi-plus" @click="openAdd" />
    </template>

    <Column field="name" header="Kode" sortable style="width: 150px" />
    <Column field="label" header="Label" sortable />
    <Column header="Permission">
      <template #body="{ data }">
        <div v-if="data.permission?.length" style="display: flex; gap: 0.25rem; flex-wrap: wrap">
          <Tag v-for="p in data.permission" :key="p" :value="p" severity="info" style="min-width: 1.5rem; justify-content: center" />
        </div>
        <span v-else style="color: var(--p-surface-400)">—</span>
      </template>
    </Column>
    <Column field="sort_order" header="Urutan" sortable style="width: 90px">
      <template #body="{ data }">
        <div class="text-right">{{ data.sort_order }}</div>
      </template>
    </Column>
    <Column field="back_date" header="Batas Edit" sortable style="width: 130px">
      <template #body="{ data }">
        <span class="text-right">
          {{ data.back_date }} / {{ data.forward_date }} hari
        </span>
      </template>
    </Column>
    <Column field="active" header="Status" sortable style="width: 100px">
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
  </DataListView>

  <Dialog
    v-model:visible="dialogVisible"
    :header="editingId ? 'Edit Menu' : 'Tambah Menu'"
    :style="{ width: '520px' }"
    modal
  >
    <form @submit.prevent="save">
      <div class="dialog-form">
        <div class="p-field">
          <label for="name">Kode Menu *</label>
          <InputText id="name" v-model="form.name" placeholder="mis. SALES" fluid />
        </div>
        <div class="p-field">
          <label for="label">Label *</label>
          <InputText id="label" v-model="form.label" placeholder="mis. Penjualan" fluid />
        </div>
        <div class="p-field">
          <label for="permission">Hak Akses (template)</label>
          <MultiSelect id="permission" v-model="form.permission" :options="permOptions" optionLabel="label" optionValue="value" fluid />
        </div>
        <div style="display: flex; gap: 1rem">
          <div class="p-field" style="flex: 1">
            <label for="sort_order">Urutan</label>
            <InputNumber id="sort_order" v-model="form.sort_order" :min="0" fluid />
          </div>
          <div class="p-field" style="flex: 1">
            <label for="back_date">Backdate (hari)</label>
            <InputNumber id="back_date" v-model="form.back_date" :min="0" fluid />
          </div>
          <div class="p-field" style="flex: 1">
            <label for="forward_date">Forwarddate (hari)</label>
            <InputNumber id="forward_date" v-model="form.forward_date" :min="0" fluid />
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