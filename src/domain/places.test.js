import { describe, expect, it } from 'vitest'
import { CITIES, formatPlace, getCity, getNeighborhood } from './places.js'

describe('catálogo de lugares', () => {
  it('gera ids estáveis, sem acento, no formato município/bairro', () => {
    expect(getNeighborhood('sao-paulo/pinheiros')?.name).toBe('Pinheiros')
    expect(getNeighborhood('campinas/barao-geraldo')?.name).toBe('Barão Geraldo')
    expect(getNeighborhood('ribeirao-preto/centro')?.cityName).toBe('Ribeirão Preto')
  })

  it('não repete ids e todo bairro aponta para seu município', () => {
    const ids = CITIES.flatMap((c) => c.neighborhoods.map((n) => n.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const city of CITIES) {
      for (const n of city.neighborhoods) expect(n.cityId).toBe(city.id)
    }
  })

  it('formatPlace e getCity tratam ids desconhecidos sem quebrar', () => {
    expect(formatPlace('sao-paulo/pinheiros')).toBe('Pinheiros · São Paulo')
    expect(formatPlace('nao/existe')).toBe('')
    expect(getNeighborhood('nao/existe')).toBeNull()
    expect(getCity('santos')?.name).toBe('Santos')
    expect(getCity('xx')).toBeNull()
  })
})
