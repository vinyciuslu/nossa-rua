import { describe, expect, it } from 'vitest'
import { filterAdminReports } from './adminQueue.js'
import { formatDuration } from './relativeTime.js'

const item = (
  id,
  {
    closed = false,
    level = 'medium',
    neighborhoodId = 'sao-paulo/mooca',
    category = 'road',
  } = {},
) => ({
  id,
  neighborhoodId,
  category,
  priority: { closed, level },
})
const items = [
  item('a'),
  item('b', { closed: true }),
  item('c', { level: 'high', neighborhoodId: 'campinas/centro', category: 'tree' }),
  item('d', { level: 'low', neighborhoodId: 'santos/gonzaga', category: 'cleaning' }),
]
const ids = (list) => list.map((i) => i.id)

describe('filterAdminReports', () => {
  it('por padrão mostra só as abertas', () => {
    expect(ids(filterAdminReports(items))).toEqual(['a', 'c', 'd'])
  })
  it('encerradas e todas', () => {
    expect(ids(filterAdminReports(items, { state: 'closed' }))).toEqual(['b'])
    expect(ids(filterAdminReports(items, { state: 'all' }))).toEqual(['a', 'b', 'c', 'd'])
  })
  it('por nível, município e categoria, combinando', () => {
    expect(ids(filterAdminReports(items, { level: 'high' }))).toEqual(['c'])
    expect(ids(filterAdminReports(items, { cityId: 'santos' }))).toEqual(['d'])
    expect(ids(filterAdminReports(items, { category: 'road', state: 'all' }))).toEqual([
      'a',
      'b',
    ])
    expect(ids(filterAdminReports(items, { cityId: 'campinas', level: 'low' }))).toEqual(
      [],
    )
  })
})

describe('formatDuration', () => {
  it('escreve tempos de espera em português', () => {
    expect(formatDuration(0.2)).toBe('menos de 1 h')
    expect(formatDuration(5)).toBe('5 h')
    expect(formatDuration(47)).toBe('47 h')
    expect(formatDuration(48)).toBe('2 dias')
    expect(formatDuration(52)).toBe('2 dias e 4 h')
    expect(formatDuration(24 * 9 + 5)).toBe('9 dias')
    expect(formatDuration(-3)).toBe('menos de 1 h')
  })
})
