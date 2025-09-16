// ==UserScript==
// @name         1688以图搜亚马逊
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在1688商品图片上悬浮一个按钮，点击后根据图片搜索亚马逊，并将结果存储和展示。
// @author       Your Name
// @match        *://*.1688.com/*
// @grant        GM_xmlhttpRequest
// @connect      192.168.31.118
// @require      https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// ==/UserScript==

(function () {
  'use strict'

  // --- 配置 ---
  const API_ENDPOINT = 'http://192.168.31.118:8000/api/upload-image'

  // --- IndexedDB 初始化 (使用 localForage 简化操作) ---
  localforage.config({
    name: 'amazonSearchResults',
    storeName: 'product_data',
    description: '存储1688以图搜亚马逊的返回结果',
  })

  // --- UI 元素创建 ---
  const searchButton = document.createElement('button')
  searchButton.innerHTML = '以图搜亚马逊'
  Object.assign(searchButton.style, {
    position: 'absolute',
    zIndex: '99999',
    top: '10px',
    left: '10px',
    padding: '8px 12px',
    backgroundColor: '#FF9900',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  })

  const resultPanel = document.createElement('div')
  Object.assign(resultPanel.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '800px',
    height: '70vh',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    zIndex: '100000',
    display: 'none',
    flexDirection: 'column',
    padding: '20px',
  })
  resultPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
            <h2 style="margin: 0;">搜索结果</h2>
            <button id="close-result-panel" style="background:none; border:none; font-size: 24px; cursor:pointer;">&times;</button>
        </div>
        <div id="result-content" style="overflow-y: auto; flex-grow: 1;">
            <p>正在加载...</p>
        </div>
    `
  document.body.appendChild(resultPanel)

  document.getElementById('close-result-panel').addEventListener('click', () => {
    resultPanel.style.display = 'none'
  })

  // --- 核心逻辑 ---

  // 将图片URL转换为Base64
  function imageToBase64(url, callback) {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function () {
      let canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      let ctx = canvas.getContext('2d')
      ctx.drawImage(this, 0, 0)
      let dataURL = canvas.toDataURL('image/jpeg')
      callback(dataURL.split(',')[1]) // 去掉前缀 "data:image/jpeg;base64,"
    }
    img.onerror = function () {
      console.error('无法加载图片，可能是跨域问题。请尝试在浏览器新标签页打开图片再试。')
    }
    // 添加时间戳以尝试绕过缓存
    img.src = url.startsWith('http') ? `${url + (url.includes('?') ? '&' : '?')}t=${new Date().getTime()}` : url
  }

  // 发起API请求
  function sendSearchRequest(base64Image) {
    showLoading()
    fetch(API_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ images: base64Image }),
      headers: {
        'Content-Type': 'application/json',
      },
      onload(response) {
        if (response.status === 200) {
          try {
            const jsonData = JSON.parse(response.responseText)
            const key = `result_${new Date().toISOString()}`

            // 保存到 IndexedDB
            localforage.setItem(key, jsonData).then(() => {
              console.log(`数据已保存到IndexedDB，键为: ${key}`)
              renderResults(jsonData)
            }).catch((err) => {
              console.error('保存到IndexedDB失败:', err)
              renderError('数据保存失败，但仍在本次展示。')
              renderResults(jsonData)
            })
          }
          catch (e) {
            console.error('解析JSON失败:', e)
            renderError(`解析服务器返回数据失败: ${e.message}`)
          }
        }
        else {
          console.error('服务器请求失败:', response.statusText)
          renderError(`服务器请求失败，状态码: ${response.status} - ${response.statusText}`)
        }
      },
      onerror(response) {
        console.error('请求发生错误:', response.statusText)
        renderError(`请求无法发送，请检查网络连接、API地址 (${API_ENDPOINT}) 是否正确，以及油猴脚本的 @connect 权限。`)
      },
    })
  }

  // --- 渲染函数 ---
  function showLoading() {
    resultPanel.style.display = 'flex'
    document.getElementById('result-content').innerHTML = '<p style="text-align:center; font-size: 16px;">正在请求服务器，请稍候...</p>'
  }

  function renderError(message) {
    resultPanel.style.display = 'flex'
    document.getElementById('result-content').innerHTML = `<p style="color: red; font-weight: bold;">错误：${message}</p>`
  }

  function renderResults(data) {
    resultPanel.style.display = 'flex'
    const contentDiv = document.getElementById('result-content')
    // 自定义渲染逻辑：这里简单地将JSON格式化后显示
    // 您可以根据实际的JSON结构来修改这里，以更友好的方式展示数据
    contentDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`

    // === 示例：如果返回的是一个商品列表，可以这样渲染 ===
    /*
        if (data && Array.isArray(data.products)) {
            let html = '<ul>';
            data.products.forEach(product => {
                html += `<li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <a href="${product.url}" target="_blank" style="text-decoration: none; color: #0073bb;">
                        <img src="${product.imageUrl}" style="width: 80px; height: 80px; float: left; margin-right: 10px;">
                        <h4 style="margin: 0;">${product.title}</h4>
                        <p style="color: #B12704; font-size: 16px;">${product.price}</p>
                    </a>
                </li>`;
            });
            html += '</ul>';
            contentDiv.innerHTML = html;
        }
        */
  }

  // --- 事件监听 ---
  function addHoverEffect(imageElement) {
    imageElement.parentElement.style.position = 'relative' // 为按钮定位设置父元素参照
    imageElement.addEventListener('mouseenter', () => {
      imageElement.parentElement.appendChild(searchButton)
    })

    searchButton.onclick = (e) => {
      e.stopPropagation() // 防止事件冒泡
      const imageUrl = imageElement.src
      if (!imageUrl) {
        alert('无法获取图片地址！')
        return
      }
      // 1688的图片URL可能包含尺寸信息，尝试获取原图
      const originalUrl = imageUrl.replace(/_\d+x\d+\.jpg$/, '.jpg')
      console.log(`正在处理图片: ${originalUrl}`)
      imageToBase64(originalUrl, (base64) => {
        if (base64) {
          sendSearchRequest(base64)
        }
      })
    }
  }

  // 监听DOM变化，确保所有图片都能被处理
  const observer = new MutationObserver(() => {
    // 这里的选择器需要根据1688页面的实际HTML结构来确定
    // 目标通常是主图和缩略图
    const images = document.querySelectorAll('.main-img')
    images.forEach((img) => {
      if (!img.dataset.hoverAttached) {
        img.dataset.hoverAttached = 'true'
        addHoverEffect(img)
      }
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // 初始加载时也执行一次
  const initialImages = document.querySelectorAll('.main-img')
  initialImages.forEach((img) => {
    if (!img.dataset.hoverAttached) {
      img.dataset.hoverAttached = 'true'
      addHoverEffect(img)
    }
  })
})()
