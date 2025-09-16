import { AsyncLocalStorage } from 'node:async_hooks'
import fs from 'node:fs'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// 请求上下文接口
interface RequestContext {
  requestId: string
}

// 使用 AsyncLocalStorage 来管理请求上下文
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

// 确保日志目录存在
const logsDir = path.resolve('./logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// 格式化日志输出
function formatFunc(info: winston.Logform.TransformableInfo) {
  const { timestamp, level, message, requestId, ...meta } = info
  let metaStr = ''
  if (Object.keys(meta).length > 0) {
    metaStr = ` ${JSON.stringify(meta, null, 2)}`
  }
  const reqIdStr = requestId ? `[${requestId}]` : ''
  return `[${timestamp}]-[${level.padEnd(7)}]${reqIdStr} ${message}${metaStr}`
}

// 创建 Winston logger 实例
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf(formatFunc),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.align(),
        winston.format.printf(formatFunc),
      ),
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: '14d',
      level: 'error',
      zippedArchive: false,
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: '14d',
      zippedArchive: false,
    }),
  ],
})

// 生成请求ID
export function generateRequestId(): string {
  return uuidv4()
}

// 在异步上下文中运行代码
export function runWithRequestId<T>(requestId: string, callback: () => T): T {
  return asyncLocalStorage.run({ requestId }, callback)
}

// 获取当前请求ID
export function getRequestId(): string | undefined {
  const context = asyncLocalStorage.getStore()
  return context?.requestId
}

// 增强的logger，自动添加请求ID
const enhancedLogger = {
  info: (message: string, meta?: any) => {
    const requestId = getRequestId()
    logger.info(message, { requestId, ...meta })
  },
  error: (message: string, meta?: any) => {
    const requestId = getRequestId()
    logger.error(message, { requestId, ...meta })
  },
  warn: (message: string, meta?: any) => {
    const requestId = getRequestId()
    logger.warn(message, { requestId, ...meta })
  },
  debug: (message: string, meta?: any) => {
    const requestId = getRequestId()
    logger.debug(message, { requestId, ...meta })
  },
}

export default enhancedLogger
