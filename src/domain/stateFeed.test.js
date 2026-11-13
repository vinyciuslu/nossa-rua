import { describe, expect, it } from 'vitest'
import {
  alertState,
  cityIdsOf,
  eventTiming,
  filterStateItems,
  groupByKind,
  isEnded,
  sortStateItems,
} from './stateFeed.js'

const NOW = new Date('2026-11-13T12:00:00Z')
const at = (hours) => new Date(NOW.getTime() + hours * 3_600_000).toISOString()

const source = { name: 'Fonte fictícia' }
const alert = (id, level, publishedH, expiresH, cityId = null) => ({
  kind: 'alert',
  id,
  level,
  title: id,
  summary: '',
  publishedAt: at(publishedH),
  expiresAt: at(expiresH),
  cityId,
  source,
})
const news = (id, publishedH, cityId = null) => ({
  kind: 'news',
  id,
  title: id,
  summary: '',
  publishedAt: at(publishedH),
  cityId,
  source,
})
const event = (id, startH, endH, cityId = null, publishedH = -48) => ({
  kind: 'event',
  id,
  title: id,
  summary: '',
  publishedAt: at(publishedH),
  startsAt: at(startH),
  endsAt: at(endH),
  cityId,
  source,
})

describe('alertState e eventTiming', () => {
  it('alerta vale até expirar', () => {
    expect(alertState(alert('a', 'info', -1, 1), NOW)).toBe('active')
    expect(alertState(alert('a', 'info', -3, -1), NOW)).toBe('expired')
  })

  it('classifica evento como futuro, em andamento ou passado', () => {
    expect(eventTiming(event('e', 2, 4), NOW)).toBe('upcoming')
    expect(eventTiming(event('e', -1, 1), NOW)).toBe('ongoing')
    expect(eventTiming(event('e', -4, -2), NOW)).toBe('past')
  })

  it('só alerta expirado e evento passado são "encerrados"', () => {
    expect(isEnded(alert('a', 'info', -3, -1), NOW)).toBe(true)
    expect(isEnded(event('e', -4, -2), NOW)).toBe(true)
    expect(isEnded(news('n', -100), NOW)).toBe(false)
  })
})

describe('filterStateItems', () => {
  const items = [
    alert('a-ativo', 'urgent', -1, 5),
    alert('a-expirado', 'info', -10, -2),
    news('n1', -3),
    event('e-futuro', 24, 26),
    event('e-passado', -30, -28),
    news('n-futuro', 5), // publicado "no futuro": relógio voltou
  ]
  const base = { cityIds: null, savedIds: new Set(), now: NOW }
  const ids = (list) => list.map((i) => i.id)

  it('"Tudo" esconde o que já encerrou e o que ainda não foi publicado', () => {
    expect(ids(filterStateItems(items, { ...base, filter: 'all' }))).toEqual([
      'a-ativo',
      'n1',
      'e-futuro',
    ])
  })

  it('o filtro do tipo mantém os encerrados, para consulta', () => {
    expect(ids(filterStateItems(items, { ...base, filter: 'alert' }))).toEqual([
      'a-ativo',
      'a-expirado',
    ])
    expect(ids(filterStateItems(items, { ...base, filter: 'event' }))).toEqual([
      'e-futuro',
      'e-passado',
    ])
  })

  it('"Salvos" traz só o que a pessoa salvou, mesmo já realizado', () => {
    const savedIds = new Set(['e-passado'])
    expect(ids(filterStateItems(items, { ...base, filter: 'saved', savedIds }))).toEqual([
      'e-passado',
    ])
  })

  it('"Salvos" não é limitado pela região', () => {
    const scoped = [
      event('e-santos', 5, 6, 'santos'),
      event('e-campinas', 5, 6, 'campinas'),
    ]
    const result = filterStateItems(scoped, {
      ...base,
      filter: 'saved',
      cityIds: ['campinas'],
      savedIds: new Set(['e-santos']),
    })
    expect(ids(result)).toEqual(['e-santos'])
  })

  it('"Meus municípios" mantém conteúdo estadual e de municípios acompanhados', () => {
    const scoped = [
      news('estadual', -1, null),
      news('campinas', -1, 'campinas'),
      news('santos', -1, 'santos'),
    ]
    const result = filterStateItems(scoped, {
      ...base,
      filter: 'all',
      cityIds: ['campinas'],
    })
    expect(ids(result)).toEqual(['estadual', 'campinas'])
  })

  it('sem municípios acompanhados, só sobra o conteúdo estadual', () => {
    const scoped = [news('estadual', -1, null), news('santos', -1, 'santos')]
    expect(
      ids(filterStateItems(scoped, { ...base, filter: 'all', cityIds: [] })),
    ).toEqual(['estadual'])
  })
})

describe('sortStateItems', () => {
  it('ordena alertas por gravidade, com os ativos antes dos encerrados', () => {
    const sorted = sortStateItems(
      [
        alert('encerrado-urgente', 'urgent', -20, -5),
        alert('info', 'info', -1, 10),
        alert('urgente', 'urgent', -2, 10),
        alert('atencao', 'attention', -3, 10),
      ],
      NOW,
    )
    expect(sorted.map((a) => a.id)).toEqual([
      'urgente',
      'atencao',
      'info',
      'encerrado-urgente',
    ])
  })

  it('eventos: o mais próximo primeiro e os passados no fim, do mais recente ao mais antigo', () => {
    const sorted = sortStateItems(
      [
        event('passado-antigo', -100, -98),
        event('longe', 100, 102),
        event('passado-recente', -10, -8),
        event('perto', 5, 7),
      ],
      NOW,
    )
    expect(sorted.map((e) => e.id)).toEqual([
      'perto',
      'longe',
      'passado-recente',
      'passado-antigo',
    ])
  })

  it('notícias: a mais nova primeiro; tipos em ordem alerta, notícia, evento', () => {
    const sorted = sortStateItems(
      [
        event('e', 5, 6),
        news('antiga', -50),
        alert('a', 'info', -1, 10),
        news('nova', -2),
      ],
      NOW,
    )
    expect(sorted.map((i) => i.id)).toEqual(['a', 'nova', 'antiga', 'e'])
  })

  it('não altera a lista original', () => {
    const original = [news('b', -50), news('a', -1)]
    sortStateItems(original, NOW)
    expect(original.map((n) => n.id)).toEqual(['b', 'a'])
  })
})

describe('groupByKind e cityIdsOf', () => {
  it('separa por tipo', () => {
    const grouped = groupByKind([
      news('n', -1),
      alert('a', 'info', -1, 2),
      event('e', 1, 2),
    ])
    expect(grouped.alerts).toHaveLength(1)
    expect(grouped.news).toHaveLength(1)
    expect(grouped.events).toHaveLength(1)
  })

  it('extrai municípios sem repetir', () => {
    expect(
      cityIdsOf([
        { neighborhoodId: 'sao-paulo/pinheiros' },
        { neighborhoodId: 'sao-paulo/mooca' },
        { neighborhoodId: 'santos/gonzaga' },
      ]),
    ).toEqual(['sao-paulo', 'santos'])
  })
})
