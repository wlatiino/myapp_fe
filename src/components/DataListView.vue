<script setup>
import { onMounted, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DataTable from 'primevue/datatable'
import api from '../api'

const props = defineProps({
  resource: { type: String, required: true },
  extra: { type: Object, default: () => ({}) },
  // Sort default (hardcoded) selalu dikirim, walau user belum klik kolom mana
  // pun — backend menolak request search tanpa sort (lihat api/search.go Q20).
  // Isi: [{ field, order }] — field = nama kolom di <Column>, order 1/-1.
  defaultSort: { type: Array, default: () => [{ field: 'id', order: -1 }] },
})

const rows = ref([])
const total = ref(0)
const first = ref(0) // index baris awal halaman aktif (offset)
const perPage = ref(10) // limit per halaman
const sortMeta = ref([]) // kosong = belum ada klik user -> pakai defaultSort
const loading = ref(false)
const error = ref('')
const search = ref('')

let timer = null

function buildSort() {
  const picked = (sortMeta.value || [])
    .filter((m) => m.field && (m.order === 1 || m.order === -1))
    .map((m) => ({ column: m.field, sort: m.order === -1 ? 'desc' : 'asc' }))
  if (picked.length) return picked
  return (props.defaultSort || []).map((m) => ({
    column: m.field,
    sort: m.order === -1 ? 'desc' : 'asc',
  }))
}

async function doLoad() {
  loading.value = true
  error.value = ''
  try {
    const body = {
      search: search.value.trim(),
      ...props.extra,
      sort: buildSort(),
      limit: perPage.value,
      offset: first.value,
    }
    const res = await api.post(`/${props.resource}/search`, body)
    rows.value = res.data?.data ?? []
    total.value = Number(res.data?.total ?? rows.value.length)
    // Halaman terakhir bisa kehilangan baris terakhir (mis. sesudah hapus);
    // kalau offset sudah di luar total, kembali ke halaman pertama.
    if (rows.value.length === 0 && first.value > 0 && total.value > 0) {
      first.value = 0
      return doLoad()
    }
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

function reload() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    first.value = 0
    doLoad()
  }, 0)
}

function onPage(event) {
  first.value = event.first
  perPage.value = event.rows
  clearTimeout(timer)
  timer = setTimeout(doLoad, 0)
}

watch(search, () => reload())
watch(sortMeta, () => reload())
watch(
  () => ({ ...props.extra }),
  () => reload(),
  { deep: true },
)

onMounted(doLoad)

defineExpose({ reload })
</script>

<template>
  <div
    style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem"
  >
    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="search" placeholder="Cari…" style="width: 280px" />
      </IconField>
      <slot name="filters" />
    </div>
    <div style="display: flex; align-items: center; gap: 0.5rem">
      <slot name="actions" />
    </div>
  </div>

  <div class="p-card">
    <p v-if="error" style="color: var(--p-red-600); margin: 0; padding: 0.5rem 1rem; font-size: 0.85rem">
      {{ error }}
    </p>
    <DataTable
      :value="rows"
      :loading="loading"
      lazy
      paginator
      :first="first"
      :rows="perPage"
      :totalRecords="total"
      :rowsPerPageOptions="[10, 25, 50]"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      current-page-report-template="{first}–{last} dari {totalRecords} data"
      v-model:multiSortMeta="sortMeta"
      sortMode="multiple"
      stripedRows
      size="small"
      @page="onPage"
    >
      <slot />
    </DataTable>
  </div>
</template>
