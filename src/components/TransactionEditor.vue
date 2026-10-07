<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import api from '../api'

const props = defineProps({
  visible: Boolean,
  mode: { type: String, required: true }, // 'sales' | 'purchase'
  title: { type: String, required: true },
  editingId: { type: Number, default: null }, // null = create, angka = edit (header + item)
  products: { type: Array, default: () => [] },
  partners: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:visible', 'saved'])

const label = computed(() =>
  props.mode === 'sales' ? 'penjualan' : 'pembelian',
)

const priceField = computed(() =>
  props.mode === 'sales' ? 'price_sell' : 'price_buy',
)

const saving = ref(false)
const error = ref('')

const form = ref({
  transaction_date: '',
  partner_id: null,
  remark: '',
  items: [],
})

const emptyRow = () => ({
  product_id: null,
  qty: 1,
  price: 0,
})

function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function productLabel(p) {
  return p ? `${p.sku} — ${p.name}` : ''
}

function productById(id) {
  return props.products.find((p) => p.id === id)
}

function priceFor(product) {
  if (!product) return 0
  const v = product[priceField.value]
  return Number(v) || 0
}

function onProductChange(row) {
  row.price = priceFor(productById(row.product_id))
}

function lineTotal(row) {
  return (Number(row.qty) || 0) * (Number(row.price) || 0)
}

const itemsTotal = computed(() =>
  form.value.items.reduce((s, it) => s + lineTotal(it), 0),
)

const productOptions = computed(() =>
  props.products
    .filter((p) => p.active)
    .map((p) => ({ ...p, label: productLabel(p), value: p.id })),
)

const partnerOptions = computed(() =>
  props.partners
    .filter((p) => p.active)
    .map((p) => ({ ...p, label: p.name, value: p.id })),
)

function addItem() {
  form.value.items.push(emptyRow())
}

function removeItem(idx) {
  form.value.items.splice(idx, 1)
}

async function loadDetail(id) {
  const res = await api.get(`/${props.mode}s/${id}`)
  const d = res.data?.data
  form.value = {
    transaction_date: toDateInput(d.transaction_date),
    partner_id: d.partner_id ?? null,
    remark: d.remark ?? '',
    items: (d.items ?? []).map((it) => ({
      product_id: it.product_id,
      qty: Number(it.qty),
      price: Number(it.price),
    })),
  }
}

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      error.value = ''
      form.value = {
        transaction_date: toDateInput(new Date()),
        partner_id: null,
        remark: '',
        items: [emptyRow()],
      }
      if (props.editingId) {
        try {
          await loadDetail(props.editingId)
        } catch (e) {
          error.value = e.response?.data?.error || e.message
        }
      }
    }
  },
)

async function save() {
  if (!form.value.transaction_date) {
    error.value = 'Tanggal wajib diisi'
    return
  }
  if (form.value.items.length === 0 || form.value.items.some((it) => !it.product_id)) {
    error.value = 'Minimal satu item dengan produk wajib dipilih'
    return
  }
  if (form.value.items.some((it) => !(Number(it.qty) > 0))) {
    error.value = 'Qty setiap item harus lebih besar dari 0'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const payload = {
      transaction_date: form.value.transaction_date,
      partner_id: form.value.partner_id || null,
      remark: form.value.remark || null,
      items: form.value.items.map((it) => ({
        product_id: it.product_id,
        qty: Number(it.qty),
        price: Number(it.price),
      })),
    }
    if (props.editingId) {
      await api.put(`/${props.mode}s/${props.editingId}`, payload)
    } else {
      await api.post(`/${props.mode}s`, payload)
    }
    emit('update:visible', false)
    emit('saved')
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Gagal menyimpan'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="editingId ? `Edit ${label}` : `Buat ${label}`"
    :style="{ width: '760px' }"
    modal
  >
    <form @submit.prevent="save">
      <div class="dialog-form">
        <div style="display: flex; gap: 1rem">
          <div class="p-field" style="flex: 1">
            <label for="tx_date">Tanggal *</label>
            <InputText id="tx_date" v-model="form.transaction_date" type="date" fluid />
          </div>
          <div class="p-field" style="flex: 2">
            <label for="tx_partner">{{ mode === 'sales' ? 'Pelanggan' : 'Pemasok' }}</label>
            <Select
              id="tx_partner"
              v-model="form.partner_id"
              :options="partnerOptions"
              option-label="name"
              option-value="id"
              show-clear
              filter
              fluid
            />
          </div>
        </div>
        <div class="p-field">
          <label for="tx_remark">Catatan</label>
          <Textarea id="tx_remark" v-model="form.remark" rows="1" fluid />
        </div>
      </div>

        <DataTable :value="form.items" size="small" responsive-layout="scroll">
          <Column header="Produk" style="min-width: 260px">
            <template #body="{ data }">
              <Select
                v-model="data.product_id"
                :options="productOptions"
                option-label="label"
                option-value="value"
                filter
                show-clear
                fluid
                @change="onProductChange(data)"
              />
            </template>
          </Column>
          <Column header="Qty" style="width: 120px">
            <template #body="{ data }">
              <InputNumber v-model="data.qty" :min="0" :min-fraction-digits="0" :max-fraction-digits="3" fluid :pt="{ input: { style: 'text-align: right' } }" />
            </template>
          </Column>
          <Column header="Harga" style="width: 160px">
            <template #body="{ data }">
              <InputNumber v-model="data.price" mode="currency" currency="IDR" locale="id-ID" fluid :pt="{ input: { style: 'text-align: right' } }" />
            </template>
          </Column>
          <Column header="Subtotal" style="width: 140px">
            <template #body="{ data }">
              <div class="text-right" style="font-weight: 600">{{ lineTotal(data).toLocaleString('id-ID') }}</div>
            </template>
          </Column>
          <Column style="width: 60px">
            <template #body="{ index }">
              <Button icon="pi pi-trash" severity="danger" rounded text size="small" @click="removeItem(index)" />
            </template>
          </Column>
        </DataTable>
        <Button type="button" label="Tambah Item" icon="pi pi-plus" severity="secondary" text @click="addItem" class="mb-2" />

      <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 0.75rem">
        <div style="font-size: 1.05rem; font-weight: 700">
          Total: {{ itemsTotal.toLocaleString('id-ID') }}
        </div>
      </div>

      <p v-if="error" style="color: var(--p-red-600); margin: 0 0 0.5rem; font-size: 0.85rem">{{ error }}</p>
      <div class="dialog-footer">
        <Button type="button" label="Batal" severity="secondary" @click="emit('update:visible', false)" />
        <Button type="submit" label="Simpan" :loading="saving" />
      </div>
    </form>
  </Dialog>
</template>