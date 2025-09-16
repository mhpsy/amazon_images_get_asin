import fs from 'node:fs'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// 请求ID上下文管理
interface RequestContext {
  requestId: string
}

// 全局请求上下文存储
const requestContextMap = new Map<string, RequestContext>()

// 为当前异步上下文生成唯一的key
function getAsyncContextKey(): string {
  return `async_${Date.now()}_${Math.random()}`
}

// 确保日志目录存在
const logsDir = path.resolve('./logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

function formatFunc(info: winston.Logform.TransformableInfo) {
  const { timestamp, level, message, requestId, ...meta } = info
  let metaStr = ''
  if (Object.keys(meta).length > 0) {
    metaStr = ` ${JSON.stringify(meta, null, 2)}`
  }
  const reqIdStr = requestId ? `[${requestId}]` : ''
  return `[${timestamp}]-[${level.padEnd(7)}]${reqIdStr} ${message}${metaStr}`
}

const logger = winston.createLogger({
  // 这里的日志级别默认为 info ，也就是只显示info和info级别以上的日志
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

// 请求ID管理函数
export function generateRequestId(): string {
  return uuidv4()
}

export function setRequestId(requestId: string): void {
  const key = getAsyncContextKey()
  requestContextMap.set(key, { requestId })
}

export function getRequestId(): string | undefined {
  for (const [key, context] of requestContextMap.entries()) {
    if (key.startsWith('async_')) {
      return context.requestId
    }
  }
  return undefined
}

export function clearRequestId(): void {
  const keysToDelete: string[] = []
  for (const key of requestContextMap.keys()) {
    if (key.startsWith('async_')) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => requestContextMap.delete(key))
}

// 增强的logger，自动添加请求ID
const enhancedLogger = {
  info: (message: string, ...args: any[]) => {
    const requestId = getRequestId()
    logger.info(message, { requestId, ...args })
  },
  error: (message: string, ...args: any[]) => {
    const requestId = getRequestId()
    logger.error(message, { requestId, ...args })
  },
  warn: (message: string, ...args: any[]) => {
    const requestId = getRequestId()
    logger.warn(message, { requestId, ...args })
  },
  debug: (message: string, ...args: any[]) => {
    const requestId = getRequestId()
    logger.debug(message, { requestId, ...args })
  },
}

export default enhancedLogger
