<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
    <button type="button" @click="count++" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
      count is {{ count }}
    </button>
    <p class="mt-4 text-gray-600 dark:text-gray-300">
      Edit
      <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
