import dayjs from 'dayjs'
import winston from 'winston'

const ts = dayjs().format('YYYY-MM-DD HH:mm:ss')

function formatFunc(info: winston.Logform.TransformableInfo) {
  const { timestamp, level, message, ...meta } = info
  let metaStr = ''
  if (Object.keys(meta).length > 0) {
    metaStr = ` ${JSON.stringify(meta, null, 2)}`
  }
  return `[${timestamp}]-[${level.padEnd(7)}] ${message}${metaStr}`
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
    new winston.transports.File({
      filename: `./logs/${ts}_error.log`,
      level: 'error',
    }),
    new winston.transports.File({
      filename: `./logs/${ts}_combined.log`,
    }),
  ],
})

export default logger
