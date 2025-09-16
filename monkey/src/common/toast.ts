// 全局提示弹窗类型定义和方法

export interface ToastOptions {
  type: 'warning' | 'danger' | 'info'
  text: string
}

// 声明全局方法类型
declare global {
  interface Window {
    showToast: (options: ToastOptions) => void
  }
}

// 全局方法包装器，提供更好的类型支持
export function showToast(options: ToastOptions) {
  if (window.showToast) {
    window.showToast(options)
  }
  else {
    console.warn('Toast container not initialized yet')
  }
}

// 便捷方法
export function showInfo(text: string) {
  showToast({ type: 'info', text })
}

export function showWarning(text: string) {
  showToast({ type: 'warning', text })
}

export function showDanger(text: string) {
  showToast({ type: 'danger', text })
}
