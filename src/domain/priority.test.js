import { describe, expect, it } from 'vitest'
import {
  MAX_BONUS,
  URGENCY_LEVELS,
  compareByPriority,
  priorityOf,
  summarizeQueue,
} from './priority.js'
import { REPORT_CATEGORIES } from './reportCategories.js'

const NOW = new Date('2026-11-13T12:00:00Z')
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3_600_000).toISOString()

function report({
  category = 'road',
  waitedH = 0,
  supports = 0,
  status = 'received',
  id = 'r',
  closedH,
} = {}) {
  const createdAt = hoursAgo(waitedH)
  const events = [{ status: 'received', at: createdAt }]
  if (status !== 'received') events.push({ status, at: hoursAgo(closedH ?? 0) })
  return { id, category, createdAt, supports, status, events }
}
const withPriority = (r, now = NOW) => ({ ...r, priority: priorityOf(r, now) })

describe('urgência por categoria', () => {
  it('toda categoria tem um nível conhecido', () => {
    for (const c of REPORT_CATEGORIES) expect(URGENCY_LEVELS[c.urgency]).toBeDefined()
  })

  it('risco (árvore, alagamento, semáforo) pesa mais que lixo', () => {
    expect(priorityOf(report({ category: 'tree' }), NOW).level).toBe('high')
    expect(priorityOf(report({ category: 'flooding' }), NOW).level).toBe('high')
    expect(priorityOf(report({ category: 'cleaning' }), NOW).level).toBe('low')
  })
})

describe('índices', () => {
  it('relato novo e sem apoio: pontuação é só a urgência', () => {
    const p = priorityOf(report({ category: 'road' }), NOW)
    expect(p).toMatchObject({ waitingIndex: 0, supportIndex: 0, bonus: 0, score: 60 })
  })

  it('a espera é medida contra o prazo do nível (média = 72 h)', () => {
    expect(priorityOf(report({ waitedH: 36 }), NOW).waitingIndex).toBe(50)
    expect(priorityOf(report({ waitedH: 72 }), NOW).waitingIndex).toBe(100)
    expect(priorityOf(report({ waitedH: 500 }), NOW).waitingIndex).toBe(100) // limitada
  })

  it('o mesmo tempo pesa mais em nível de prazo curto', () => {
    const high = priorityOf(report({ category: 'tree', waitedH: 12 }), NOW)
    const low = priorityOf(report({ category: 'cleaning', waitedH: 12 }), NOW)
    expect(high.waitingIndex).toBeGreaterThan(low.waitingIndex)
  })

  it('o apoio chega ao máximo com 20 apoios', () => {
    expect(priorityOf(report({ supports: 10 }), NOW).supportIndex).toBe(50)
    expect(priorityOf(report({ supports: 20 }), NOW).supportIndex).toBe(100)
    expect(priorityOf(report({ supports: 90 }), NOW).supportIndex).toBe(100)
  })

  it('o bônus é limitado a +15, e o valor sem limite continua visível', () => {
    const p = priorityOf(report({ waitedH: 500, supports: 40 }), NOW)
    expect(p.rawBonus).toBe(25)
    expect(p.bonus).toBe(MAX_BONUS)
    expect(p.score).toBe(60 + MAX_BONUS)
  })

  it('marca o relato como atrasado só depois do prazo', () => {
    expect(priorityOf(report({ waitedH: 72 }), NOW).overdue).toBe(false)
    expect(priorityOf(report({ waitedH: 73 }), NOW).overdue).toBe(true)
  })
})

describe('nível de urgência sempre vem primeiro', () => {
  it('um relato de baixa urgência, o mais antigo e apoiado possível, não passa um de média', () => {
    const lowMaxed = withPriority(
      report({ id: 'a', category: 'cleaning', waitedH: 9999, supports: 500 }),
    )
    const mediumFresh = withPriority(report({ id: 'b', category: 'road' }))
    expect(lowMaxed.priority.score).toBeLessThan(mediumFresh.priority.score)
    expect([lowMaxed, mediumFresh].sort(compareByPriority)[0].id).toBe('b')
  })

  it('vale para todos os pares de níveis, nos extremos', () => {
    const levels = Object.values(URGENCY_LEVELS)
    for (const upper of levels) {
      for (const lower of levels) {
        if (upper.index <= lower.index) continue
        expect(upper.index).toBeGreaterThan(lower.index + MAX_BONUS)
      }
    }
  })

  it('dentro do mesmo nível, espera e apoio desempatam', () => {
    const fresh = withPriority(report({ id: 'a', waitedH: 1 }))
    const waiting = withPriority(report({ id: 'b', waitedH: 60 }))
    const supported = withPriority(report({ id: 'c', waitedH: 1, supports: 20 }))
    const sorted = [fresh, supported, waiting].sort(compareByPriority).map((r) => r.id)
    expect(sorted).toEqual(['b', 'c', 'a'])
  })

  it('empate de pontuação: o mais antigo primeiro, depois o id', () => {
    const older = withPriority(report({ id: 'z', waitedH: 0.1 }))
    const newer = withPriority(report({ id: 'a', waitedH: 0 }))
    expect([newer, older].sort(compareByPriority)[0].id).toBe('z')
    const x = withPriority(report({ id: 'x' }))
    const y = withPriority(report({ id: 'y' }))
    expect([y, x].sort(compareByPriority).map((r) => r.id)).toEqual(['x', 'y'])
  })
})

describe('relato encerrado', () => {
  it('para de esperar quando foi encerrado', () => {
    const r = report({ waitedH: 100, status: 'resolved', closedH: 60 })
    const p = priorityOf(r, NOW)
    expect(p.closed).toBe(true)
    expect(p.waitedHours).toBeCloseTo(40, 6)
    expect(p.overdue).toBe(false)
    // e continua parado mesmo se o relógio avançar
    const later = priorityOf(r, new Date(NOW.getTime() + 1000 * 3_600_000))
    expect(later.waitedHours).toBeCloseTo(40, 6)
  })
})

describe('summarizeQueue', () => {
  it('conta abertos, atrasados, por nível e encerrados', () => {
    const items = [
      withPriority(report({ id: '1', category: 'tree', waitedH: 30 })), // aberto, atrasado
      withPriority(report({ id: '2', category: 'road', waitedH: 10 })),
      withPriority(report({ id: '3', category: 'cleaning', waitedH: 5 })),
      withPriority(report({ id: '4', waitedH: 50, status: 'resolved', closedH: 10 })),
    ]
    const s = summarizeQueue(items)
    expect(s).toMatchObject({
      open: 3,
      overdue: 1,
      closed: 1,
      byLevel: { high: 1, medium: 1, low: 1 },
    })
    expect(s.averageWaitHours).toBeCloseTo((30 + 10 + 5) / 3, 6)
  })

  it('fila vazia não dá divisão por zero', () => {
    expect(summarizeQueue([]).averageWaitHours).toBe(0)
  })
})
