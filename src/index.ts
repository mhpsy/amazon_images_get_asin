import process from 'node:process'
import logger from '@/log'
import { startServer } from './server'

async function main() {
  try {
    // 从环境变量读取端口号，默认3000
    const port = Number(process.env.PORT) || 8000
    const host = process.env.HOST || '0.0.0.0'

    logger.info('正在启动Amazon图片处理API服务器...')

    // 启动Fastify服务器
    await startServer(port, host)
  }
  catch (error) {
    logger.error('服务启动失败:', error)
    process.exit(1)
  }
}

main()
