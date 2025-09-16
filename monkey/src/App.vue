<script setup lang="ts">
import ToastContainer from './components/res.vue'
</script>

<template>
  <div class="monkey-app">
    <ToastContainer />
  </div>
</template>

<style scoped>
.monkey-app{
  position: fixed;
  top: 0;
  left: 0;
  width: 2px;
  height: 2px;
  z-index: 10000;
}
</style>
