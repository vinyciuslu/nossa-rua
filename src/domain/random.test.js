import { describe, expect, it } from 'vitest'
import { createRng } from './random.js'

describe('createRng', () => {
  it('é reproduzível com a mesma semente (número ou texto)', () => {
    const a = createRng('nossa-rua')
    const b = createRng('nossa-rua')
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b))
    const c = createRng(42)
    const d = createRng(42)
    expect(c()).toBe(d())
  })

  it('sementes diferentes dão sequências diferentes', () => {
    expect(createRng('a')()).not.toBe(createRng('b')())
  })

  it('devolve valores em [0, 1)', () => {
    const rng = createRng(1)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('sem semente usa Math.random', () => {
    expect(createRng()).toBe(Math.random)
  })
})
