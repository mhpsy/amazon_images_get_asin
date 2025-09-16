import type { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

/**
 * 将base64字符串转换为Buffer，可用于文件上传
 * @param base64String - base64编码的图片字符串
 * @returns Buffer对象
 */
export async function base64ToBuffer(base64String: string): Promise<Buffer> {
  // 移除base64字符串中的data:image前缀（如果存在）
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '')

  // 动态导入buffer模块
  const { Buffer } = await import('node:buffer')
  // 将base64转换为Buffer
  return Buffer.from(base64Data, 'base64')
}

/**
 * 将base64字符串转换为临时文件路径
 * @param base64String - base64编码的图片字符串
 * @param filename - 文件名（可选，默认为temp-image.jpg）
 * @returns 临时文件的完整路径
 */
export async function base64ToTempFile(base64String: string, filename: string = 'temp-image.jpg'): Promise<string> {
  const tempDir = os.tmpdir()
  const tempFilePath = path.join(tempDir, filename)

  const buffer = await base64ToBuffer(base64String)
  await fs.writeFile(tempFilePath, buffer)
  return tempFilePath
}

/**
 * 获取base64图片的MIME类型
 * @param base64String - base64编码的图片字符串
 * @returns MIME类型字符串
 */
export function getBase64MimeType(base64String: string): string {
  const mimeMatch = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)
  return mimeMatch ? mimeMatch[1] : 'image/jpeg'
}

/**
 * 获取base64图片的文件扩展名
 * @param base64String - base64编码的图片字符串
 * @returns 文件扩展名
 */
export function getBase64FileExtension(base64String: string): string {
  const mimeType = getBase64MimeType(base64String)

  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/gif':
      return '.gif'
    case 'image/webp':
      return '.webp'
    default:
      return '.jpg'
  }
}
