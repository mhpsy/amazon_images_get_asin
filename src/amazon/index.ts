import type { Page } from 'playwright'
import type { ImageSearchResults } from './imageSearchResults'
import logger from '@/log'
import { base64ToBuffer, getBase64FileExtension, getBase64MimeType, sleep } from '@/utils'
import { chromium } from 'playwright'
import { ImageSearchResultsSchema } from './imageSearchResults'

const browserWSEndpoint = `wss://brd-customer-hl_a1d5b24f-zone-amazon_upload_images_get_asin:yv5sw40u0yen@brd.superproxy.io:9222`
const TARGET_KEYWORD = 'stylesnapToken'

export interface AmazonUploadOptions {
  url: string
  imagesBase64: string
  timeout?: number
}

export interface AmazonUploadResult {
  success: boolean
  imageSearchResults?: ImageSearchResults
  error?: string
}

let screenshotCount = 0

function getScreenshot(page: Page, logs: string = 'screenshot') {
  const timestamp = Date.now()
  screenshotCount++
  logger.info(`[${screenshotCount}] ${logs}`)
  return page.screenshot({ path: `./temp/screenshot/screenshot-${timestamp}-${screenshotCount}.png` })
}

// 不加载图片、字体、媒体等资源
function blockResources(page: Page) {
  return page.route('**/*', (route) => {
    const resourceType = route.request().resourceType()
    if (resourceType === 'image'
      || resourceType === 'font'
      || resourceType === 'media') {
      return route.abort()
    }
    return route.continue()
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
  let page

  try {
    browser = await chromium.connectOverCDP(browserWSEndpoint)
    // browser = await chromium.launch({
    //   channel: 'chrome',
    //   headless: false,
    // })
    logger.info(`Connected to browser, navigating to: ${url}`)

    page = await browser.newPage()
    logger.info(`New page created, goto url: ${url}`)

    await blockResources(page)

    try {
      await page.goto(url, { timeout: 40000, waitUntil: 'domcontentloaded' })

      await getScreenshot(page, 'screenshot-1')
      await sleep(1000)
    }
    catch (error) {
      logger.warn('Navigation timed out after 10s, continue anyway', { error })
    }

    logger.info('Page loaded, waiting for file input')
    await page.waitForSelector('#file', { timeout: 30000 })

    // 使用字节级文件上传（不依赖远端文件系统路径）
    const extension = getBase64FileExtension(imagesBase64)
    const filename = `image-${Date.now()}${extension}`
    const mimeType = getBase64MimeType(imagesBase64)
    const fileBuffer = await base64ToBuffer(imagesBase64)

    // 在触发上传前开始等待目标响应
    const stylesnapResponsePromise = page.waitForResponse(
      (response) => {
        const reqUrl = response.request().url()
        return reqUrl.includes(TARGET_KEYWORD) && response.ok()
      },
      { timeout },
    )

    await page.setInputFiles('#file', {
      name: filename,
      mimeType,
      buffer: fileBuffer,
    })
    logger.info(`Uploaded file via bytes: ${filename} (${mimeType}, ${fileBuffer.byteLength} bytes)`)

    // const data = await page.evaluate(() => {
    //   // @ts-ignore
    //   const fileInputUrl = document.getElementsByName('stylesnap')[0].value
    //   return encodeURIComponent(fileInputUrl)
    // })

    // logger.info(`File input URL: ${data}`)

    // 这里需要根据Amazon的具体页面结构来调整选择器
    try {
      await sleep(1000)
      logger.info('Waiting for ASIN generation')
      await getScreenshot(page, 'screenshot-2')
      await page.waitForSelector('#product_grid_container > div > section.tab-content', { timeout: 60000 })
      await getScreenshot(page, 'screenshot-3')

      // 读取并解析目标接口的响应
      const targetResponse = await stylesnapResponsePromise
      const responseBody = await targetResponse.json()
      // logger.info('   << Response JSON Body:', responseBody)
      const res = ImageSearchResultsSchema.parse(responseBody)
      logger.info('   << Response JSON Body:', res.searchResults[0].bbxAsinList)

      return { success: true, imageSearchResults: ImageSearchResultsSchema.parse(responseBody) }
    }
    catch (error) {
      logger.error('Timeout waiting for ASIN', error)
      return { success: false, error: 'Timeout waiting for ASIN' }
    }
  }
  catch (error) {
    logger.error('Error uploading images to Amazon:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
  finally {
    if (browser) {
      // await getScreenshot(page!, 'browser-close')
      await browser.close()
      logger.info('Browser closed')
    }
  }
}
