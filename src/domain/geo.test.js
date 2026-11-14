import { describe, expect, it } from 'vitest'
import {
  boundsOf,
  buildPath,
  distanceMeters,
  fractionOfVertex,
  pointAtFraction,
} from './geo.js'

describe('distanceMeters', () => {
  it('é zero entre o mesmo ponto', () => {
    expect(distanceMeters([-23.55, -46.63], [-23.55, -46.63])).toBe(0)
  })

  it('1 grau de latitude vale cerca de 111 km', () => {
    const d = distanceMeters([-23, -46], [-24, -46])
    expect(d).toBeGreaterThan(111_000)
    expect(d).toBeLessThan(111_400)
  })

  it('é simétrica', () => {
    const a = [-23.55, -46.63]
    const b = [-22.9, -47.06]
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6)
  })
})

describe('percurso', () => {
  const path = buildPath([
    [0, 0],
    [0, 1],
    [1, 1],
  ])

  it('acumula distâncias', () => {
    expect(path.cumulative[0]).toBe(0)
    expect(path.cumulative[2]).toBeCloseTo(path.total, 6)
    expect(path.total).toBeGreaterThan(path.cumulative[1])
  })

  it('o início e o fim ficam nas pontas', () => {
    expect(pointAtFraction(path, 0)).toEqual([0, 0])
    expect(pointAtFraction(path, 1)[0]).toBeCloseTo(1, 6)
    expect(pointAtFraction(path, 1)[1]).toBeCloseTo(1, 6)
  })

  it('o ponto da fração de um vértice é o próprio vértice', () => {
    const f = fractionOfVertex(path, 1)
    const [lat, lng] = pointAtFraction(path, f)
    expect(lat).toBeCloseTo(0, 5)
    expect(lng).toBeCloseTo(1, 5)
  })

  it('interpola no meio de um trecho', () => {
    const [lat, lng] = pointAtFraction(path, fractionOfVertex(path, 1) / 2)
    expect(lat).toBeCloseTo(0, 5)
    expect(lng).toBeCloseTo(0.5, 3)
  })

  it('limita frações fora de 0..1', () => {
    expect(pointAtFraction(path, -2)).toEqual([0, 0])
    expect(pointAtFraction(path, 5)[0]).toBeCloseTo(1, 6)
  })
})

describe('boundsOf', () => {
  it('devolve sul-oeste e norte-leste', () => {
    expect(
      boundsOf([
        [-23.5, -46.7],
        [-23.6, -46.5],
        [-23.55, -46.6],
      ]),
    ).toEqual([
      [-23.6, -46.7],
      [-23.5, -46.5],
    ])
  })
})
