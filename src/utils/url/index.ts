import logger from '@/log'

/**
 * 从亚马逊商品URL中提取ASIN
 * @param url - 亚马逊商品URL
 * @returns ASIN字符串，如果无法提取则返回null
 */
export function getAsinFromUrl(url: string): string | null {
  // 检查URL是否为空
  if (!url) {
    logger.error('URL is empty')
    return null
  }

  logger.info(`Extracting ASIN from URL: ${url}`)

  // 尝试匹配常见的亚马逊URL模式
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /asin=([A-Z0-9]{10})/i,
    /asin\/([A-Z0-9]{10})/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      logger.info(`Extracted ASIN: ${match[1]}`)
      return match[1]
    }
  }

  return null
}
