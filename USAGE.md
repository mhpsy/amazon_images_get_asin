# Amazon Image Upload - Base64 转换使用指南

本项目提供了将base64图片数据上传到Amazon并获取ASIN的功能。

## 主要功能

### 1. Base64 到 Buffer 转换
```typescript
import { base64ToBuffer } from './src/utils'

const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'
const buffer = await base64ToBuffer(base64Image)
console.log(`Buffer size: ${buffer.length} bytes`)
```

### 2. Base64 到临时文件转换
```typescript
import { base64ToTempFile, getBase64FileExtension } from './src/utils'

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...'
const extension = getBase64FileExtension(base64Image) // '.png'
const tempFilePath = await base64ToTempFile(base64Image, `image${extension}`)
console.log(`Temp file created: ${tempFilePath}`)

// 使用完后记得清理临时文件
import { unlink } from 'node:fs/promises'
await unlink(tempFilePath)
```

### 3. 上传图片到Amazon
```typescript
import { uploadImagesToAmazon } from './src/amazon'

const uploadOptions = {
  url: 'https://www.amazon.com/your-upload-page', // Amazon上传页面URL
  imagesBase64: [
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...'
  ],
  timeout: 5 * 60 * 1000 // 5分钟超时（可选）
}

const result = await uploadImagesToAmazon(uploadOptions)

if (result.success) {
  console.log(`上传成功！ASIN: ${result.asin}`)
} else {
  console.error(`上传失败: ${result.error}`)
}
```

### 4. 向后兼容的单图片上传
```typescript
import { runAmazon } from './src/amazon'

try {
  const asin = await runAmazon(
    'https://www.amazon.com/your-upload-page',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'
  )
  console.log(`ASIN: ${asin}`)
} catch (error) {
  console.error('上传失败:', error.message)
}
```

## 工具函数

### 获取MIME类型
```typescript
import { getBase64MimeType } from './src/utils'

const mimeType = getBase64MimeType('data:image/jpeg;base64,/9j/...')
console.log(mimeType) // 'image/jpeg'
```

### 获取文件扩展名
```typescript
import { getBase64FileExtension } from './src/utils'

const extension = getBase64FileExtension('data:image/png;base64,iVBORw0...')
console.log(extension) // '.png'
```

## 注意事项

1. **浏览器连接**: 代码使用了Bright Data的代理浏览器服务，确保连接字符串正确。

2. **页面选择器**: Amazon页面的DOM结构可能会变化，需要根据实际页面调整选择器：
   - 文件上传输入框: `#file`
   - ASIN结果元素: `[data-asin]`, `.asin-result`, `#asin` 等

3. **错误处理**: 所有函数都包含适当的错误处理和日志记录。

4. **临时文件清理**: 上传过程中创建的临时文件会自动清理。

5. **超时设置**: 默认超时时间为5分钟，可以根据需要调整。

## 开发和测试

运行开发模式：
```bash
npm run dev
```

运行测试：
```bash
npm test
```

构建项目：
```bash
npm run build
```
