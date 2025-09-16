import type { Page } from 'puppeteer-core'
import { unlink } from 'node:fs/promises'
import logger from '@/log'
import { base64ToTempFile, getBase64FileExtension, sleep } from '@/utils'
import puppeteer from 'puppeteer-core'

const browserWSEndpoint = `wss://brd-customer-hl_a1d5b24f-zone-amazon_upload_images_get_asin:yv5sw40u0yen@brd.superproxy.io:9222`

export interface AmazonUploadOptions {
  url: string
  imagesBase64: string
  timeout?: number
}

export interface AmazonUploadResult {
  success: boolean
  productList?: string[]
  error?: string
}

let screenshotCount = 0

function getScreenshot(page: Page, logs: string = 'screenshot') {
  const timestamp = Date.now()
  screenshotCount++
  logger.info(`${logs}-${screenshotCount}`)
  return page.screenshot({ path: `./temp/screenshot/screenshot-${timestamp}-${screenshotCount}.png` })
}

function pageRequestCallback(page: Page) {
  const TARGET_KEYWORD = 'stylesnapToken' // 将目标关键词定义成常量，方便修改

  // 监听请求发起事件
  page.on('request', (request) => {
    const url = request.url()

    // 核心判断：只处理URL包含目标关键词的请求
    if (url.includes(TARGET_KEYWORD)) {
      logger.info(`✅ [Request MATCH] Found request with "${TARGET_KEYWORD}":`)
      logger.info(`   >> Method: ${request.method()}, URL: ${url}`)

      if (request.method() === 'POST' && request.postData()) {
        logger.info(`   >> POST Data: ${request.postData()}`)
      }
    }
  })

  // 监听请求成功完成事件 (接收到响应)
  page.on('response', async (response) => {
    const url = response.request().url()

    // 同样对响应进行过滤
    if (url.includes(TARGET_KEYWORD)) {
      logger.info(`✅ [Response MATCH] For request with "${TARGET_KEYWORD}":`)
      logger.info(`   << Status: ${response.status()}, URL: ${url}`)

      // 尝试解析并打印响应体，这对于调试至关重要
      try {
        const responseBody = await response.json() // 如果是JSON，直接解析
        logger.info('   << Response JSON Body:', JSON.stringify(responseBody, null, 2))
        logger.error(`   << Response JSON Body: ${JSON.stringify(responseBody, null, 2)}`)
      }
      catch {
        // 如果解析JSON失败，尝试作为文本打印
        const responseText = await response.text()
        logger.info(`   << Response Text Body (first 300 chars): ${responseText.substring(0, 300)}`)
        logger.error(`   << Response Text Body (first 300 chars): ${responseText.substring(0, 300)}`)
      }
    }
  })

  // 监听请求失败事件
  page.on('requestfailed', (request) => {
    const url = request.url()

    // 同样对失败的请求进行过滤
    if (url.includes(TARGET_KEYWORD)) {
      logger.error(`❌ [Request Failed MATCH] For request with "${TARGET_KEYWORD}":`)
      logger.error(`   >> URL: ${url}`)
      logger.error(`   >> Failure Reason: ${request.failure()?.errorText}`)
    }
  })
}

/**
 * 上传图片到Amazon并获取ASIN
 * @param options - 上传选项
 * @returns 上传结果
 */
export async function uploadImagesToAmazon(options: AmazonUploadOptions): Promise<AmazonUploadResult> {
  const { url, imagesBase64, timeout = 5 * 60 * 1000 } = options

  if (!imagesBase64 || imagesBase64.length === 0) {
    return { success: false, error: 'No images provided' }
  }

  let browser
  let useTempFilePaths: string = ''
  let page

  try {
    browser = await puppeteer.connect({ browserWSEndpoint })
    logger.info(`Connected to browser, navigating to: ${url}`)

    page = await browser.newPage()
    pageRequestCallback(page)

    await page.goto(url, { timeout })

    logger.info('Page loaded, waiting for file input')
    await page.waitForSelector('#file', { timeout: 30000 })

    // 转换所有base64图片为临时文件
    const extension = getBase64FileExtension(imagesBase64)
    const filename = `image-${Date.now()}${extension}`

    const tempFilePath = await base64ToTempFile(imagesBase64, filename)
    useTempFilePaths = tempFilePath
    logger.info(`Created temp file: ${tempFilePath}`)

    return { success: true, productList: [] }
  }
  catch (error) {
    logger.error('Error uploading images to Amazon:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
  finally {
    // 清理临时文件
    try {
      await unlink(useTempFilePaths)
      logger.info(`Cleaned up temp file: ${useTempFilePaths}`)
    }
    catch (error) {
      logger.warn(`Failed to clean up temp file ${useTempFilePaths}:`, error)
    }

    // 关闭浏览器
    if (browser) {
      await getScreenshot(page!, 'browser-close')
      await browser.close()
      logger.info('Browser closed')
    }
  }
}

// 保持向后兼容的函数
export async function runAmazon(url: string, imagesBase64: string) {
  const result = await uploadImagesToAmazon({
    url,
    imagesBase64,
  })

  if (!result.success) {
    throw new Error(result.error)
  }

  return result.productList
}
