<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast-${toast.type}`]"
      class="toast-item"
    >
      <div class="toast-content">
        {{ toast.text }}
      </div>
      <button class="toast-close" @click="removeToast(toast.id)">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

export interface ToastItem {
  id: number
  type: 'warning' | 'danger' | 'info'
  text: string
  timer?: number
}

export interface ToastOptions {
  type: 'warning' | 'danger' | 'info'
  text: string
}

const toasts = ref<ToastItem[]>([])
let toastId = 0

const addToast = (options: ToastOptions) => {
  const id = ++toastId
  const toast: ToastItem = {
    id,
    type: options.type,
    text: options.text
  }
  
  toasts.value.push(toast)
  
  // 10秒后自动移除
  toast.timer = window.setTimeout(() => {
    removeToast(id)
  }, 10000)
}

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    const toast = toasts.value[index]
    if (toast.timer) {
      clearTimeout(toast.timer)
    }
    toasts.value.splice(index, 1)
  }
}

// 全局方法
const showToast = (options: ToastOptions) => {
  addToast(options)
}

// 暴露给全局使用
onMounted(() => {
  // 将方法挂载到 window 对象上
  ;(window as any).showToast = showToast
})

onUnmounted(() => {
  // 清理定时器
  toasts.value.forEach(toast => {
    if (toast.timer) {
      clearTimeout(toast.timer)
    }
  })
  // 移除全局方法
  delete (window as any).showToast
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10001;
  width: 100%;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 12px 16px;
  border-radius: 6px;
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); */
  pointer-events: auto;
  animation: slideIn 0.3s ease-out;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-content {
  flex: 1;
  margin-right: 8px;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  margin: 0;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

.toast-info {
  background-color: #e1f5fe;
  color: #01579b;
  border-left: 4px solid #0288d1;
}

.toast-warning {
  background-color: #fff3e0;
  color: #e65100;
  border-left: 4px solid #ff9800;
}

.toast-danger {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #f44336;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
