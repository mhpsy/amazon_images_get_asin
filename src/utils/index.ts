import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

export function sleep(a: number) {
  return new Promise(resolve => setTimeout(resolve, a))
}

/**
 * 读取文件并转换为base64
 * @param filePath - 文件路径
 * @returns base64字符串
 */
export async function fileToBase64(filePath: string): Promise<string> {
  try {
    const buffer = await readFile(filePath)
    return buffer.toString('base64')
  }
  catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`)
  }
}

/**
 * 读取temp文件夹中的所有图片文件并转换为base64
 * @param fileName - 文件名，如果不提供则默认读取images.png
 * @returns base64字符串
 */
export async function readTempImageAsBase64(fileName?: string): Promise<string> {
  const defaultFileName = fileName || 'images.png'
  const filePath = join(process.cwd(), 'temp', defaultFileName)
  return await fileToBase64(filePath)
}

/**
 * 将结果保存为txt文件到temp文件夹
 * @param content - 要保存的内容
 * @param fileName - 文件名，默认为result.txt
 */
export async function saveResultToTempTxt(content: string, fileName?: string): Promise<void> {
  const defaultFileName = fileName || 'result.txt'
  const filePath = join(process.cwd(), 'temp', defaultFileName)

  try {
    await writeFile(filePath, content, 'utf8')
    // 使用logger代替console.log
  }
  catch (error) {
    throw new Error(`Failed to save result to ${filePath}: ${error}`)
  }
}

export * from './image'
