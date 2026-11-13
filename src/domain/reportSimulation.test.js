import { describe, expect, it } from 'vitest'
import { sortFeed, filterFeed } from './feed.js'
import { formatRelative } from './relativeTime.js'
import { getCategory, REPORT_CATEGORIES } from './reportCategories.js'
import { planStatusPath, simulateStatusEvents } from './statusSimulation.js'

const T0 = new Date('2026-11-01T12:00:00-03:00')
const HOUR = 3_600_000

describe('formatRelative', () => {
  const at = (ms) => new Date(T0.getTime() - ms).toISOString()
  it('usa a unidade certa em cada faixa', () => {
    expect(formatRelative(at(10_000), T0)).toBe('agora')
    expect(formatRelative(at(5 * 60_000), T0)).toBe('há 5 min')
    expect(formatRelative(at(2.5 * HOUR), T0)).toBe('há 2 h')
    expect(formatRelative(at(30 * HOUR), T0)).toBe('ontem')
    expect(formatRelative(at(4 * 24 * HOUR), T0)).toBe('há 4 dias')
    expect(formatRelative(at(10 * 24 * HOUR), T0)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
  it('data no futuro (relógio de demonstração voltou) vira "agora"', () => {
    expect(formatRelative(new Date(T0.getTime() + HOUR).toISOString(), T0)).toBe('agora')
  })
})

describe('categorias', () => {
  it('têm ids únicos e getCategory cai na primeira se o id for desconhecido', () => {
    expect(new Set(REPORT_CATEGORIES.map((c) => c.id)).size).toBe(
      REPORT_CATEGORIES.length,
    )
    expect(getCategory('tree').label).toBe('Árvore')
    expect(getCategory('x').id).toBe('road')
  })
})

describe('ciclo de status simulado', () => {
  const post = (n) => ({ id: `post-${n}`, createdAt: T0.toISOString() })

  it('é determinístico: mesmo relato, mesmo percurso', () => {
    expect(planStatusPath(post(1))).toEqual(planStatusPath(post(1)))
  })

  it('começa sempre pela publicação do morador (real), e o resto é simulado', () => {
    for (let i = 0; i < 100; i++) {
      const [first, ...rest] = planStatusPath(post(i))
      expect(first).toMatchObject({ status: 'received', by: 'author' })
      expect(first.simulated).toBeUndefined()
      for (const e of rest) {
        expect(e.simulated).toBe(true)
        expect(e.by).toBe('moderation')
        expect(e.note).toMatch(/^Simulação/)
      }
    }
  })

  it('é cronológico e nunca passa de "não procedente" ou "resolvida"', () => {
    for (let i = 0; i < 300; i++) {
      const path = planStatusPath(post(i))
      const times = path.map((e) => e.at.getTime())
      expect(times).toEqual([...times].sort((a, b) => a - b))
      const statuses = path.map((e) => e.status)
      expect(
        statuses.filter((s) => s === 'resolved' || s === 'not_applicable').length,
      ).toBeLessThanOrEqual(1)
      if (statuses.includes('not_applicable')) expect(statuses).not.toContain('resolved')
    }
  })

  it('em 300 relatos aparecem todos os desfechos, inclusive etapa pulada e relato sem atualização', () => {
    const finals = new Set()
    let skipped = 0
    for (let i = 0; i < 300; i++) {
      const statuses = planStatusPath(post(i)).map((e) => e.status)
      finals.add(statuses.at(-1))
      if (statuses.includes('in_progress') && !statuses.includes('forwarded')) skipped++
    }
    expect([...finals].sort()).toEqual(
      [
        'forwarded',
        'in_progress',
        'in_review',
        'not_applicable',
        'received',
        'resolved',
      ].sort(),
    )
    expect(skipped).toBeGreaterThan(0)
  })

  it('só revela as etapas que já aconteceram em `now`', () => {
    const p = post(7)
    const full = planStatusPath(p)
    const end = full.at(-1).at
    expect(simulateStatusEvents(p, new Date(T0.getTime() - HOUR))).toEqual([])
    expect(simulateStatusEvents(p, end)).toHaveLength(full.length)
    expect(simulateStatusEvents(p, T0)).toHaveLength(1)
    expect(typeof simulateStatusEvents(p, end)[0].at).toBe('string')
  })
})

describe('ordem e filtro do feed', () => {
  const mk = (id, type, hoursAgo, level) => ({
    id,
    type,
    level,
    createdAt: new Date(T0.getTime() - hoursAgo * HOUR).toISOString(),
  })
  const posts = [
    mk('velho', 'report', 30),
    mk('novo', 'report', 1),
    mk('urgente-recente', 'notice', 5, 'urgent'),
    mk('urgente-antigo', 'notice', 40, 'urgent'),
    mk('comercio', 'commercial', 2),
  ]

  it('urgente recente fixa no topo; o resto vai do mais novo ao mais antigo', () => {
    expect(sortFeed(posts, T0).map((p) => p.id)).toEqual([
      'urgente-recente',
      'novo',
      'comercio',
      'velho',
      'urgente-antigo',
    ])
  })

  it('não altera o array original e filtra por tipo', () => {
    const copy = [...posts]
    sortFeed(posts, T0)
    expect(posts).toEqual(copy)
    expect(filterFeed(posts, 'notice')).toHaveLength(2)
    expect(filterFeed(posts, 'all')).toHaveLength(5)
  })
})
