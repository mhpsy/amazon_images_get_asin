import logger from '@/log'
import { add } from '@/utils'

const a: number = 1

const b = '2'

const c = a + b

const d = add(a, 1)

logger.info('test')

logger.error('error')

logger.warn('warn')

logger.debug('debug', { a: d })

export {
  a,
  b,
  c,
  d,
}
