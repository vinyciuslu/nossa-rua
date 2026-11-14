import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THRESHOLDS,
  classifyTraffic,
  compareBySeverity,
  localTime,
  sensorReading,
  startOfLocalDay,
  trafficRatio,
  validateThresholds,
} from './traffic.js'

// Hora de São Paulo = UTC-3. 2026-11-11 é quarta-feira; 2026-11-14 é sábado.
const sp = (day, hh, mm = 0) => new Date(Date.UTC(2026, 10, day, hh + 3, mm))
const sensor = { id: 's-teste', freeFlowKmh: 60, morning: 0.9, evening: 0.9 }

describe('classifyTraffic', () => {
  it('usa 75% e 40% por padrão, com limites nas bordas corretas', () => {
    expect(classifyTraffic(100)).toBe('free')
    expect(classifyTraffic(75)).toBe('free')
    expect(classifyTraffic(74)).toBe('moderate')
    expect(classifyTraffic(40)).toBe('moderate')
    expect(classifyTraffic(39)).toBe('heavy')
  })

  it('aceita limites diferentes', () => {
    const strict = { freeFrom: 90, heavyBelow: 60 }
    expect(classifyTraffic(80, strict)).toBe('moderate')
    expect(classifyTraffic(59, strict)).toBe('heavy')
  })
})

describe('validateThresholds', () => {
  it('aceita os limites padrão', () => {
    expect(validateThresholds(DEFAULT_THRESHOLDS)).toBeNull()
  })
  it('recusa valores fora de 1..99 ou na ordem errada', () => {
    expect(validateThresholds({ freeFrom: 100, heavyBelow: 40 })).toMatch(/entre 1 e 99/)
    expect(validateThresholds({ freeFrom: 30, heavyBelow: 40 })).toMatch(/menor/)
    expect(validateThresholds({ freeFrom: NaN, heavyBelow: 40 })).toMatch(/entre 1 e 99/)
  })
})

describe('hora local', () => {
  it('converte para o horário de São Paulo, não o do aparelho', () => {
    expect(localTime(sp(11, 8, 30))).toEqual({ hour: 8.5, weekend: false })
    expect(localTime(sp(14, 10)).weekend).toBe(true)
  })

  it('a meia-noite local vira o dia em São Paulo', () => {
    const t = sp(11, 22) // 22h de quarta, local
    expect(startOfLocalDay(t)).toBe(sp(11, 0).getTime())
    const lateUtc = new Date(Date.UTC(2026, 10, 12, 1)) // 22h de quarta em SP
    expect(startOfLocalDay(lateUtc)).toBe(sp(11, 0).getTime())
  })
})

describe('trafficRatio', () => {
  it('fica entre 0,12 e 1', () => {
    for (let h = 0; h < 24; h += 0.5) {
      const r = trafficRatio(sensor, sp(11, Math.floor(h), (h % 1) * 60).getTime())
      expect(r).toBeGreaterThanOrEqual(0.12)
      expect(r).toBeLessThanOrEqual(1)
    }
  })

  it('o pico da manhã é bem pior que a madrugada', () => {
    const peak = trafficRatio(sensor, sp(11, 8).getTime())
    const night = trafficRatio(sensor, sp(11, 3).getTime())
    expect(peak).toBeLessThan(0.4)
    expect(night).toBeGreaterThan(0.85)
  })

  it('fim de semana é mais livre que dia útil no mesmo horário', () => {
    expect(trafficRatio(sensor, sp(14, 18).getTime())).toBeGreaterThan(
      trafficRatio(sensor, sp(11, 18).getTime()),
    )
  })

  it('é determinístico e suave (sem saltos entre minutos)', () => {
    const t = sp(11, 10).getTime()
    expect(trafficRatio(sensor, t)).toBe(trafficRatio(sensor, t))
    expect(
      Math.abs(trafficRatio(sensor, t) - trafficRatio(sensor, t + 60_000)),
    ).toBeLessThan(0.05)
  })

  it('sensores diferentes têm ruído diferente', () => {
    const other = { ...sensor, id: 's-outro' }
    const t = sp(11, 12).getTime()
    expect(trafficRatio(sensor, t)).not.toBe(trafficRatio(other, t))
  })
})

describe('sensorReading', () => {
  it('lê a cada minuto: dentro do mesmo minuto a leitura não muda', () => {
    const a = sensorReading(sensor, new Date(sp(11, 9).getTime() + 5_000))
    const b = sensorReading(sensor, new Date(sp(11, 9).getTime() + 55_000))
    expect(a).toEqual(b)
    expect(a.updatedAt).toBe(sp(11, 9).toISOString())
  })

  it('no pico fica "intenso", de madrugada "livre", com velocidade coerente', () => {
    const peak = sensorReading(sensor, sp(11, 8))
    if (peak.status === 'ok') {
      expect(peak.level).toBe('heavy')
      expect(peak.speedKmh).toBeLessThan(0.4 * 60 + 1)
    }
    const night = sensorReading(sensor, sp(11, 3))
    if (night.status === 'ok') expect(night.level).toBe('free')
  })

  it('às vezes o sensor fica sem leitura e então não inventa velocidade', () => {
    const readings = []
    for (let i = 0; i < 400; i++) {
      readings.push(
        sensorReading(sensor, new Date(sp(11, 0).getTime() + i * 30 * 60_000)),
      )
    }
    const offline = readings.filter((r) => r.status === 'offline')
    expect(offline.length).toBeGreaterThan(0)
    expect(offline.length).toBeLessThan(readings.length * 0.15)
    for (const r of offline) {
      expect(r).toMatchObject({ level: 'unknown', speedKmh: null, percent: null })
    }
  })

  it('respeita limites personalizados', () => {
    const t = sp(11, 13)
    const base = sensorReading(sensor, t)
    if (base.status !== 'ok') return
    const custom = sensorReading(sensor, t, { freeFrom: 99, heavyBelow: 98 })
    expect(custom.level).not.toBe('free')
  })
})

describe('compareBySeverity', () => {
  it('ordena intenso, moderado, livre e sem leitura', () => {
    const levels = ['unknown', 'free', 'heavy', 'moderate'].map((level) => ({ level }))
    expect(levels.sort(compareBySeverity).map((l) => l.level)).toEqual([
      'heavy',
      'moderate',
      'free',
      'unknown',
    ])
  })
})
