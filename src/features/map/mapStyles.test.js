import { describe, expect, it } from 'vitest'
import { TRAFFIC_STYLES, trafficLineStyle } from './mapStyles.js'

describe('estilos do trânsito no mapa', () => {
  it('cada nível tem um padrão de traço diferente, não só uma cor', () => {
    const signatures = Object.values(TRAFFIC_STYLES).map(
      (s) => `${s.dashArray}|${s.weight}`,
    )
    expect(new Set(signatures).size).toBe(signatures.length)
  })

  it('o congestionamento intenso é o traço mais grosso', () => {
    const heaviest = Math.max(...Object.values(TRAFFIC_STYLES).map((s) => s.weight))
    expect(TRAFFIC_STYLES.heavy.weight).toBe(heaviest)
  })

  it('nível desconhecido cai no estilo "sem leitura"', () => {
    expect(trafficLineStyle('qualquer-coisa').className).toBe('nr-line-unknown')
  })

  it('traços tracejados têm ponta arredondada; o contínuo não', () => {
    expect(trafficLineStyle('free').lineCap).toBe('butt')
    expect(trafficLineStyle('heavy').lineCap).toBe('round')
  })
})
