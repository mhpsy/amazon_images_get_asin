import { add } from '@/utils'
import { describe, expect, it } from 'vitest'

describe('test', () => {
  it('should be equal', () => {
    expect(add(1, 2)).toBe(3)
  })
})
