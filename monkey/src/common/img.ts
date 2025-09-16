import type { App } from 'vue'
import { createApp } from 'vue'
import SearchButton from '../components/searchButton.vue'

const imgSize = 80

let currentButtonApp: App | null = null
let currentButtonContainer: HTMLElement | null = null

export function runImg() {
  // 监听鼠标悬浮在图片上
  document.body.addEventListener('mouseover', (e) => {
    if (!(e.target instanceof HTMLElement))
      return
    if (e.target.tagName !== 'IMG')
      return
    if (e.target.offsetHeight < imgSize || e.target.offsetWidth < imgSize)
      return

    const img = e.target as HTMLImageElement
    const parent = img.parentElement

    if (parent) {
      // 如果父元素没有相对定位，按钮定位会出错
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative'
      }

      // 如果已经有按钮了，直接显示
      if (currentButtonContainer && currentButtonContainer.parentElement === parent) {
        currentButtonContainer.style.display = 'block'
        return
      }

      // 清理之前的按钮
      if (currentButtonApp) {
        currentButtonApp.unmount()
        currentButtonContainer?.remove()
      }

      // 创建一个新的容器用于挂载按钮
      const buttonContainer = document.createElement('div')
      buttonContainer.style.position = 'absolute'
      buttonContainer.style.top = '0'
      buttonContainer.style.left = '0'
      buttonContainer.style.width = '100%'
      buttonContainer.style.height = '100%'
      buttonContainer.style.pointerEvents = 'none' // 让容器不阻挡点击事件
      buttonContainer.style.zIndex = '1'

      // 让按钮区域可以接收点击事件
      buttonContainer.addEventListener('mouseover', (event) => {
        const target = event.target as HTMLElement
        if (target.tagName === 'BUTTON' || target.closest('button')) {
          buttonContainer.style.pointerEvents = 'auto'
        }
      })

      buttonContainer.addEventListener('mouseout', (event) => {
        const relatedTarget = event.relatedTarget as HTMLElement
        if (!buttonContainer.contains(relatedTarget)) {
          buttonContainer.style.pointerEvents = 'none'
        }
      })

      parent.appendChild(buttonContainer)
      currentButtonApp = createApp(SearchButton, {
        imgSrc: img.src,
      })
      currentButtonApp.mount(buttonContainer)
      currentButtonContainer = buttonContainer
    }
  })
}

runImg()
