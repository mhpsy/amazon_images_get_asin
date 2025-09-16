import type { Browser, Page } from 'playwright'
import type { ImageSearchResults } from './imageSearchResults'
import logger from '@/log'
import { base64ToBuffer, getBase64FileExtension, getBase64MimeType } from '@/utils'
import { chromium } from 'playwright'
import { ImageSearchResultsSchema } from './imageSearchResults'

// --- Configuration Section ---
const BROWSER_WSE_ENDPOINT = `wss://brd-customer-hl_a1d5b24f-zone-amazon_upload_images_get_asin:yv5sw40u0yen@brd.superproxy.io:9222`
const TARGET_KEYWORD = 'stylesnapToken'

// Selectors are now constants for easier maintenance
const SELECTORS = {
  fileInput: '#file',
  resultsContainer: '#product_grid_container > div > section.tab-content',
}

const TIMEOUTS = {
  navigation: 40000,
  element: 30000,
  results: 60000,
  total: 5 * 60 * 1000,
}

// --- Interfaces (unchanged) ---
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

// --- Helper Functions ---

let screenshotCount = 0
function getScreenshot(page: Page, logs: string = 'screenshot') {
  const timestamp = Date.now()
  screenshotCount++
  logger.info(`[${screenshotCount}] ${logs}`)
  return page.screenshot({ path: `./temp/screenshot/screenshot-${timestamp}-${screenshotCount}.png` })
}

// No changes needed for blockResources, it's already great!
function blockResources(page: Page) {
  return page.route('**/*', (route) => {
    const resourceType = route.request().resourceType()
    if (['image', 'font', 'media'].includes(resourceType)) {
      return route.abort()
    }
    return route.continue()
  })
}

/**
 * NEW: Handles navigation with a graceful timeout.
 */
async function navigateToPage(page: Page, url: string) {
  try {
    logger.info(`Navigating to ${url}`)
    await page.goto(url, { timeout: TIMEOUTS.navigation, waitUntil: 'domcontentloaded' })
    await getScreenshot(page, 'screenshot-1-nav-success')
  }
  catch (error) {
    logger.warn('Navigation timed out, but continuing as the page might be usable.', { error })
    await getScreenshot(page, 'screenshot-1-nav-timeout')
  }
}

/**
 * NEW: Encapsulates the file upload logic.
 */
async function uploadImageFromBase64(page: Page, imagesBase64: string) {
  await page.waitForSelector(SELECTORS.fileInput, { timeout: TIMEOUTS.element })

  const fileBuffer = await base64ToBuffer(imagesBase64)
  const mimeType = getBase64MimeType(imagesBase64)
  const extension = getBase64FileExtension(imagesBase64)
  const filename = `image-${Date.now()}${extension}`

  await page.setInputFiles(SELECTORS.fileInput, {
    name: filename,
    mimeType,
    buffer: fileBuffer,
  })

  logger.info(`Uploaded file via bytes: ${filename} (${mimeType}, ${fileBuffer.byteLength} bytes)`)
}

/**
 * NEW: Waits for results and parses them. This is the core logic improvement.
 */
async function waitForAndParseResults(page: Page, totalTimeout: number): Promise<ImageSearchResults> {
  logger.info('Waiting for API response and UI update concurrently...')

  const [targetResponse] = await Promise.all([
    // Condition 1: Wait for the network response containing the ASIN data.
    page.waitForResponse(
      response => response.request().url().includes(TARGET_KEYWORD) && response.ok(),
      { timeout: totalTimeout },
    ),
    // Condition 2: Must wait for the results container to be visible on the page.
    page.waitForSelector(SELECTORS.resultsContainer, { timeout: TIMEOUTS.results }),
  ])

  await getScreenshot(page, 'screenshot-2-results-loaded')
  logger.info('API response received and UI container is visible.')

  const responseBody = await targetResponse.json()
  const parsedResults = ImageSearchResultsSchema.parse(responseBody)
  logger.info('Successfully parsed ASINs from response.', { firstAsinList: parsedResults.searchResults[0]?.bbxAsinList })

  return parsedResults
}

// --- Main Function (Refactored) ---

export async function uploadImagesToAmazon(options: AmazonUploadOptions): Promise<AmazonUploadResult> {
  const { url, imagesBase64, timeout = TIMEOUTS.total } = options

  if (!imagesBase64 || imagesBase64.length === 0) {
    return { success: false, error: 'No images provided' }
  }

  let browser: Browser | null = null

  // A single, top-level try/catch/finally to manage the browser lifecycle.
  try {
    logger.info(`Connecting to remote browser...`)
    browser = await chromium.connectOverCDP(BROWSER_WSE_ENDPOINT) // connect is often simpler than connectOverCDP for this use case
    const context = await browser.newContext()
    logger.info(`New context created.`)
    const page = await context.newPage()
    logger.info(`New page created.`)

    await blockResources(page)
    logger.info(`Block resources.`)

    await navigateToPage(page, url)
    logger.info(`Navigated to page.`)

    // Here is not await, because we want to trigger the upload first.
    // and need listen the results.
    const resultsPromise = waitForAndParseResults(page, timeout)

    logger.info(`Trigger the upload.`)
    // Trigger the upload.
    await uploadImageFromBase64(page, imagesBase64)

    logger.info(`Awaiting the results.`)
    // Await the results.
    const imageSearchResults = await resultsPromise

    logger.info(`Results received.`)
    return { success: true, imageSearchResults }
  }
  catch (error) {
    logger.error('An error occurred during the Amazon upload process:', error)
    // The screenshot here is commented out but is a great idea for debugging failures.
    // if (page) await getScreenshot(page, 'error-screenshot');
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' }
  }
  finally {
    if (browser) {
      await browser.close()
      logger.info('Browser connection closed.')
    }
  }
}
