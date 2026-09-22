<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => route.query.label || route.name)
</script>

<template>
  <h1 class="page-title">{{ title }}</h1>
  <p class="page-subtitle">Halaman ini masih dalam pengembangan (under construction).</p>
</template>