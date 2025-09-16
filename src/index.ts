import { uploadImagesToAmazon } from '@/amazon'
import logger from '@/log'
import { readTempImageAsBase64, saveResultToTempTxt } from '@/utils'

async function main() {
  try {
    // 从temp文件夹读取图片并转换为base64
    const imageBase64 = await readTempImageAsBase64('images.png')
    logger.info('成功读取temp/images.png并转换为base64')

    // 上传到Amazon并获取结果
    const result = await uploadImagesToAmazon({
      url: 'https://www.amazon.com/stylesnap',
      imagesBase64: imageBase64,
    })

    logger.info('Amazon处理结果:', result)

    // 将结果转换为字符串并保存到temp文件夹
    const resultText = JSON.stringify(result, null, 2)
    await saveResultToTempTxt(resultText, 'amazon_result.txt')

    logger.info('处理完成，结果已保存到temp/amazon_result.txt')
  }
  catch (error) {
    logger.error('处理过程中出现错误:', error)

    // 即使出错也保存错误信息到文件
    const errorText = `处理失败: ${error instanceof Error ? error.message : String(error)}\n时间: ${new Date().toISOString()}`
    await saveResultToTempTxt(errorText, 'error_log.txt')
  }
}

main()
