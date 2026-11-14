import { beforeEach, describe, expect, it } from 'vitest'
import { goToLocalHour } from '../test/clockHelpers.js'
import { clock } from './clock.js'
import { getMobilitySnapshot, listMobilityCities } from './mobilityService.js'

beforeEach(() => clock.reset())

describe('listMobilityCities', () => {
  it('lista os municípios com dados', async () => {
    const cities = await listMobilityCities()
    expect(cities.map((c) => c.id)).toEqual(['sao-paulo', 'campinas', 'santos'])
  })
})

describe('getMobilitySnapshot', () => {
  it('falha com not_found para município sem dados', async () => {
    await expect(getMobilitySnapshot('osasco')).rejects.toMatchObject({
      code: 'not_found',
    })
  })

  it('devolve trechos com leitura e linhas com ônibus e paradas', async () => {
    goToLocalHour(12)
    const snap = await getMobilitySnapshot('sao-paulo')
    expect(snap.cityName).toBe('São Paulo')
    expect(snap.segments.length).toBeGreaterThan(5)
    expect(snap.lines.length).toBeGreaterThan(1)
    for (const segment of snap.segments) {
      expect(segment.path).toHaveLength(2)
      expect(['ok', 'offline']).toContain(segment.reading.status)
    }
    for (const line of snap.lines) {
      expect(line.running).toBe(true)
      expect(line.buses.length).toBeGreaterThan(0)
      expect(line.stops.every((s) => s.arrivals.length > 0)).toBe(true)
    }
  })

  it('o enquadramento do mapa contém todos os trechos', async () => {
    const snap = await getMobilitySnapshot('campinas')
    const [[south, west], [north, east]] = snap.bounds
    for (const [lat, lng] of snap.segments.flatMap((s) => s.path)) {
      expect(lat).toBeGreaterThanOrEqual(south)
      expect(lat).toBeLessThanOrEqual(north)
      expect(lng).toBeGreaterThanOrEqual(west)
      expect(lng).toBeLessThanOrEqual(east)
    }
  })

  it('de madrugada não há ônibus nem previsões', async () => {
    goToLocalHour(3)
    const snap = await getMobilitySnapshot('sao-paulo')
    for (const line of snap.lines) {
      expect(line.running).toBe(false)
      expect(line.buses).toEqual([])
      expect(line.stops.every((s) => s.arrivals.length === 0)).toBe(true)
    }
  })

  it('o pico da manhã tem mais trechos intensos que o fim da noite', async () => {
    const heavy = async (hour) => {
      goToLocalHour(hour)
      const snap = await getMobilitySnapshot('sao-paulo')
      return snap.segments.filter((s) => s.reading.level === 'heavy').length
    }
    expect(await heavy(8)).toBeGreaterThan(await heavy(23))
  })

  it('os ônibus se mexem com o relógio', async () => {
    goToLocalHour(12)
    const before = await getMobilitySnapshot('sao-paulo')
    clock.advance(10 * 60_000)
    const after = await getMobilitySnapshot('sao-paulo')
    expect(after.lines[0].buses[0].position).not.toEqual(
      before.lines[0].buses[0].position,
    )
  })

  it('limites personalizados mudam a classificação', async () => {
    goToLocalHour(12)
    const normal = await getMobilitySnapshot('sao-paulo')
    const strict = await getMobilitySnapshot('sao-paulo', {
      thresholds: { freeFrom: 99, heavyBelow: 98 },
    })
    const free = (s) => s.segments.filter((x) => x.reading.level === 'free').length
    expect(free(strict)).toBeLessThanOrEqual(free(normal))
  })
})
