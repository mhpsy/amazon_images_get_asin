<script lang="ts" setup>
import { ref } from 'vue'

interface Props {
  imgSrc?: string
}

const props = defineProps<Props>()

const text = ref('亚马逊搜图')
const handleClick = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  console.log('搜索亚马逊，图片地址:', props.imgSrc)

}
</script>

<template>
  <button @click.stop="handleClick" class="search-button">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
    {{ text }}
  </button>
</template>

<style scoped>
.search-button{
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  background-color: #ff9900;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: auto; /* 确保按钮可以被点击 */
}

.search-button:hover {
  background-color: #e88b00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.search-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
