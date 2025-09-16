import { createApp } from 'vue'
import App from './App.vue'
import { runImg } from './common' // 导入图片监听功能
import './style.css'

createApp(App).mount(
  (() => {
    const app = document.createElement('div')
    document.body.append(app)
    console.log('monkey')

    runImg()

    return app
  })(),
)
