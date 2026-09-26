import { describe, expect, it } from 'vitest'
import { money, toMajor, toMinor } from './format'

describe('money helpers', () => {
  it('round-trips baht and satang', () => {
    expect(toMinor('590')).toBe(59000)
    expect(toMinor('12.5')).toBe(1250)
    expect(toMinor('')).toBeNull()
    expect(toMajor(59000)).toBe('590')
    expect(money(116000)).toBe('฿1,160')
  })
})
