import { describe, expect, it } from 'vitest'
import { formatGen, parseGenAmount } from './amounts'

describe('GEN amount conversion', () => {
  it('converts decimal GEN exactly to 18-decimal base units', () => {
    expect(parseGenAmount('2')).toBe(2000000000000000000n)
    expect(parseGenAmount('0.000000000000000001')).toBe(1n)
    expect(parseGenAmount('12.340000000000000000')).toBe(12340000000000000000n)
  })

  it('rejects precision that cannot be represented by the contract', () => {
    expect(() => parseGenAmount('1.0000000000000000001')).toThrow()
    expect(() => parseGenAmount('-1')).toThrow()
  })

  it('formats base units without floating-point rounding', () => {
    expect(formatGen(6000000000000000000n)).toBe('6')
    expect(formatGen(1000000000000000001n)).toBe('1.000000000000000001')
  })
})
