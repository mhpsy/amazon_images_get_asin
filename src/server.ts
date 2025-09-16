import process from 'node:process'
import { uploadImagesToAmazon } from '@/amazon'
import logger, { clearRequestId, generateRequestId, setRequestId } from '@/log'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import Fastify from 'fastify'

const fastify = Fastify({
  logger: false, // 使用我们自己的logger
})

// 注册插件（异步注册）
export async function registerPlugins() {
  // 注册跨域插件
  await fastify.register(cors, {
    origin: true, // 允许所有域名
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // 注册sensible插件（提供常用HTTP状态码）
  await fastify.register(sensible)
}

// 请求ID中间件
fastify.addHook('onRequest', async (request, reply) => {
  const requestId = generateRequestId()
  setRequestId(requestId)

  // 将requestId添加到请求头中，方便前端追踪
  reply.header('X-Request-ID', requestId)

  logger.info(`[${request.method}] ${request.url} - 请求开始`)
})

// 请求完成后清理中间件
fastify.addHook('onResponse', async (request, reply) => {
  const statusCode = reply.statusCode

  logger.info(`[${request.method}] ${request.url} - 请求完成 [${statusCode}]`)
  clearRequestId()
})

// 错误处理中间件
fastify.setErrorHandler((error, request, reply) => {
  logger.error(`请求处理错误: ${error.message}`, { error: error.stack })

  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: '请求参数验证失败',
      details: error.validation,
    })
  }

  return reply.status(500).send({
    success: false,
    error: '服务器内部错误',
  })
})

// 健康检查接口
fastify.get('/health', async (_request, _reply) => {
  return {
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
  }
})

// 图片处理接口
interface ImageUploadBody {
  imageBase64: string
  url?: string
}

fastify.post<{ Body: ImageUploadBody }>('/api/upload-image', {
  schema: {
    body: {
      type: 'object',
      required: ['imageBase64'],
      properties: {
        imageBase64: {
          type: 'string',
          minLength: 1,
          description: 'Base64编码的图片数据',
        },
      },
    },
  },
}, async (request, reply) => {
  const { imageBase64, url = 'https://www.amazon.com/stylesnap' } = request.body

  logger.info('收到图片上传请求', {
    imageSize: imageBase64.length,
    targetUrl: url,
  })

  try {
    // 验证base64格式
    if (!imageBase64.includes('data:image/') && !imageBase64.startsWith('/9j/') && !imageBase64.startsWith('iVBORw0KGgo')) {
      return reply.status(400).send({
        success: false,
        error: '无效的base64图片格式',
      })
    }

    logger.info('开始处理图片上传到Amazon')

    const result = await uploadImagesToAmazon({
      url: 'https://www.amazon.com/stylesnap',
      imagesBase64: imageBase64,
      timeout: 5 * 60 * 1000, // 5分钟超时
    })

    if (result.success) {
      logger.info('Amazon图片处理成功', {
        hasResults: !!result.imageSearchResults,
        resultsCount: result.imageSearchResults?.searchResults?.length || 0,
      })

      return reply.send({
        success: true,
        data: result.imageSearchResults,
        message: '图片处理完成',
      })
    }
    else {
      logger.error('Amazon图片处理失败', { error: result.error })

      return reply.status(500).send({
        success: false,
        error: result.error || 'Amazon处理失败',
      })
    }
  }
  catch (error) {
    logger.error('图片上传处理异常', { error: error instanceof Error ? error.message : error })

    return reply.status(500).send({
      success: false,
      error: '图片处理过程中发生异常',
    })
  }
})

// 启动服务器函数
export async function startServer(port: number = 3000, host: string = '0.0.0.0') {
  try {
    // 注册插件
    await registerPlugins()

    await fastify.listen({ port, host })
    logger.info(`🚀 服务器启动成功，运行在 http://${host}:${port}`)
    logger.info(`📊 健康检查接口: http://${host}:${port}/health`)
    logger.info(`🖼️ 图片上传接口: http://${host}:${port}/api/upload-image`)
    return fastify
  }
  catch (error) {
    logger.error('服务器启动失败', { error })
    process.exit(1)
  }
}

export default fastify
