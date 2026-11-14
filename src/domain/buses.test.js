import { describe, expect, it } from 'vitest'
import {
  arrivalsAt,
  busSpeedFactor,
  busesOf,
  formatEta,
  isInService,
  lineProgress,
  withStopFractions,
} from './buses.js'
import { buildPath } from './geo.js'

const sp = (hh, mm = 0) => new Date(Date.UTC(2026, 10, 11, hh + 3, mm))
const points = [
  [0, 0],
  [0, 0.1],
  [0.1, 0.1],
  [0, 0], // circular: volta ao início
]
const path = buildPath(points)
const baseLine = {
  id: 'l1',
  cycleMinutes: 60,
  busCount: 3,
  stops: [
    { id: 'p0', name: 'Início', vertexIndex: 0 },
    { id: 'p1', name: 'Meio', vertexIndex: 1 },
    { id: 'p2', name: 'Fim', vertexIndex: 2 },
  ],
}
const line = withStopFractions(baseLine, path)
const free = () => 1

describe('horário de operação', () => {
  it('opera das 5h às 23h30, hora de São Paulo', () => {
    expect(isInService(sp(4, 59))).toBe(false)
    expect(isInService(sp(5))).toBe(true)
    expect(isInService(sp(23, 29))).toBe(true)
    expect(isInService(sp(23, 30))).toBe(false)
  })
})

describe('busSpeedFactor', () => {
  it('trânsito livre mantém a velocidade; parado ainda anda um pouco', () => {
    expect(busSpeedFactor(1)).toBe(1)
    expect(busSpeedFactor(0)).toBeCloseTo(0.3)
    expect(busSpeedFactor(0.5)).toBeGreaterThan(busSpeedFactor(0.2))
  })
})

describe('withStopFractions', () => {
  it('cada parada guarda sua fração do percurso, crescente', () => {
    const fractions = line.stops.map((s) => s.fraction)
    expect(fractions[0]).toBe(0)
    expect(fractions[1]).toBeGreaterThan(0)
    expect(fractions[2]).toBeGreaterThan(fractions[1])
    expect(fractions[2]).toBeLessThan(1)
  })
})

describe('lineProgress', () => {
  it('em trânsito livre, 30 min de operação = meia volta de uma linha de 60 min', () => {
    expect(lineProgress(line, free, sp(5, 30))).toBeCloseTo(0.5, 6)
  })

  it('antes de abrir a operação o progresso é zero', () => {
    expect(lineProgress(line, free, sp(4))).toBe(0)
  })

  it('trânsito ruim faz a linha andar menos', () => {
    const slow = lineProgress(line, () => 0.2, sp(9))
    const fast = lineProgress(line, free, sp(9))
    expect(slow).toBeLessThan(fast)
    expect(slow).toBeGreaterThan(0)
  })

  it('é contínuo: dois minutos depois, o progresso mal mudou', () => {
    const a = lineProgress(line, () => 0.6, sp(10, 0))
    const b = lineProgress(line, () => 0.6, sp(10, 2))
    expect(b).toBeGreaterThan(a)
    expect(b - a).toBeLessThan(0.05)
  })
})

describe('busesOf', () => {
  it('distribui os ônibus igualmente pela volta', () => {
    const buses = busesOf(line, path, 0)
    buses.forEach((b, i) => expect(b.fraction).toBeCloseTo(i / 3, 9))
    expect(buses.map((b) => b.id)).toEqual(['l1-1', 'l1-2', 'l1-3'])
  })

  it('a posição dá a volta (progresso 1,25 = 25% da volta)', () => {
    const [first] = busesOf(line, path, 1.25)
    expect(first.fraction).toBeCloseTo(0.25, 9)
  })

  it('a posição fica sobre o percurso', () => {
    const [bus] = busesOf(line, path, 0.5)
    expect(bus.position).toHaveLength(2)
    expect(bus.position.every(Number.isFinite)).toBe(true)
  })
})

describe('arrivalsAt', () => {
  const buses = busesOf(line, path, 0) // frações 0, 1/3, 2/3
  const stop = { ...line.stops[1], fraction: 0.5 }

  it('lista no máximo 3, do mais perto ao mais longe', () => {
    const arrivals = arrivalsAt(line, stop, buses, 1)
    expect(arrivals).toHaveLength(3)
    const etas = arrivals.map((a) => a.etaMs)
    expect([...etas].sort((a, b) => a - b)).toEqual(etas)
  })

  it('em trânsito livre, o ônibus a meia volta de distância chega em meia volta', () => {
    const [nearest] = arrivalsAt(line, stop, buses, 1)
    // ônibus em 1/3 está a (0,5 - 1/3) da parada: 1/6 de volta = 10 min
    expect(nearest.etaMs / 60_000).toBeCloseTo(10, 6)
    expect(nearest.busId).toBe('l1-2')
  })

  it('trânsito ruim aumenta a espera', () => {
    const [free1] = arrivalsAt(line, stop, buses, 1)
    const [slow] = arrivalsAt(line, stop, buses, 0.2)
    expect(slow.etaMs).toBeGreaterThan(free1.etaMs)
  })

  it('um ônibus que acabou de passar só volta depois de quase uma volta', () => {
    const justPassed = [{ id: 'x', number: 1, fraction: 0.51 }]
    const [a] = arrivalsAt(line, stop, justPassed, 1)
    expect(a.etaMs / 60_000).toBeGreaterThan(58)
  })
})

describe('formatEta', () => {
  it('formata em português', () => {
    expect(formatEta(20_000)).toBe('chegando')
    expect(formatEta(4 * 60_000)).toBe('em 4 min')
    expect(formatEta(60 * 60_000)).toBe('em 1 h')
    expect(formatEta(70 * 60_000)).toBe('em 1 h 10 min')
  })
})
