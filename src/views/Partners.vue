<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import api from '../api'
import DataListView from '../components/DataListView.vue'
import { hasPerm } from '../store/auth'

const MENU = 'BISNIS_PARTNER'

const list = ref(null)
const dialogVisible = ref(false)
const saving = ref(false)
const error = ref('')
const editingId = ref(null)

const emptyForm = () => ({
  name: '',
  address: '',
  email: '',
  phone: '',
  contact: '',
  company: '',
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
    address: row.address ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    contact: row.contact ?? '',
    company: row.company ?? '',
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
      await api.put(`/partners/${editingId.value}`, form.value)
    } else {
      await api.post('/partners', form.value)
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
  if (!confirm(`Hapus mitra "${row.name}"?`)) return
  try {
    await api.delete(`/partners/${row.id}`)
    await load()
  } catch (e) {
    alert(e.response?.data?.error || e.message || 'Gagal menghapus')
  }
}
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: space-between">
    <div>
      <h1 class="page-title">Mitra Bisnis</h1>
      <p class="page-subtitle">Pelanggan & pemasok</p>
    </div>
  </div>

  <DataListView ref="list" resource="partners">
    <template #actions>
      <Button v-if="hasPerm(MENU, 'A')" label="Tambah Mitra" icon="pi pi-plus" @click="openAdd" />
    </template>

    <Column field="name" header="Nama" sortable />
    <Column field="contact" header="Kontak Person" sortable />
    <Column field="company" header="Perusahaan" sortable />
    <Column field="phone" header="Telepon" sortable />
    <Column field="email" header="Email" sortable />
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
    :header="editingId ? 'Edit Mitra' : 'Tambah Mitra'"
    :style="{ width: '520px' }"
    modal
  >
    <form @submit.prevent="save">
      <div class="dialog-form">
        <div class="p-field">
          <label for="name">Nama *</label>
          <InputText id="name" v-model="form.name" fluid />
        </div>
        <div class="p-field">
          <label for="company">Perusahaan</label>
          <InputText id="company" v-model="form.company" fluid />
        </div>
        <div class="p-field">
          <label for="contact">Kontak Person</label>
          <InputText id="contact" v-model="form.contact" fluid />
        </div>
        <div style="display: flex; gap: 1rem">
          <div class="p-field" style="flex: 1">
            <label for="phone">Telepon</label>
            <InputText id="phone" v-model="form.phone" fluid />
          </div>
          <div class="p-field" style="flex: 1">
            <label for="email">Email</label>
            <InputText id="email" v-model="form.email" fluid />
          </div>
        </div>
        <div class="p-field">
          <label for="address">Alamat</label>
          <Textarea id="address" v-model="form.address" rows="3" fluid />
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