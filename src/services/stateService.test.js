import { beforeEach, describe, expect, it } from 'vitest'
import { alertState, eventTiming } from '../domain/stateFeed.js'
import { clock } from './clock.js'
import {
  deleteAccountSavedEvents,
  getStateItem,
  listStateItems,
  toggleSavedEvent,
} from './stateService.js'

const HOUR = 3_600_000

beforeEach(() => clock.reset())

describe('conteúdo do seed', () => {
  it('tem alertas, notícias e eventos, todos marcados como fictícios', async () => {
    const items = await listStateItems()
    const kinds = new Set(items.map((i) => i.kind))
    expect(kinds).toEqual(new Set(['alert', 'news', 'event']))
    expect(items.every((i) => i.simulated === true)).toBe(true)
  })

  it('nenhuma fonte usa o nome de um órgão real', async () => {
    const items = await listStateItems()
    const names = new Set(items.map((i) => i.source.name))
    for (const name of names) expect(name).toMatch(/Fictíci[oa]/)
  })

  it('tem conteúdo estadual e de municípios, para o filtro de região', async () => {
    const items = await listStateItems()
    expect(items.some((i) => i.cityId === null)).toBe(true)
    expect(items.some((i) => i.cityId !== null)).toBe(true)
  })

  it('mostra pelo menos um alerta ativo e um evento futuro de partida', async () => {
    const now = clock.now()
    const items = await listStateItems()
    expect(items.some((i) => i.kind === 'alert' && alertState(i, now) === 'active')).toBe(
      true,
    )
    expect(
      items.some((i) => i.kind === 'event' && eventTiming(i, now) === 'upcoming'),
    ).toBe(true)
  })

  it('adiantar o relógio faz alertas expirarem e eventos acontecerem', async () => {
    const items = await listStateItems()
    const activeAlerts = (now) =>
      items.filter((i) => i.kind === 'alert' && alertState(i, now) === 'active').length
    const pastEvents = (now) =>
      items.filter((i) => i.kind === 'event' && eventTiming(i, now) === 'past').length
    const now = clock.now()
    const later = new Date(now.getTime() + 30 * 24 * HOUR)
    expect(activeAlerts(later)).toBeLessThan(activeAlerts(now))
    expect(pastEvents(later)).toBeGreaterThan(pastEvents(now))
  })
})

describe('getStateItem', () => {
  it('devolve um item pelo id', async () => {
    const [first] = await listStateItems()
    expect((await getStateItem(first.id)).id).toBe(first.id)
  })

  it('falha com not_found para id desconhecido', async () => {
    await expect(getStateItem('nao-existe')).rejects.toMatchObject({ code: 'not_found' })
  })
})

describe('eventos salvos', () => {
  const eventId = async () => (await listStateItems()).find((i) => i.kind === 'event').id

  it('salva e remove, só para a conta que salvou', async () => {
    const id = await eventId()
    expect((await toggleSavedEvent({ eventId: id, accountId: 'a1' })).saved).toBe(true)
    const forA1 = await getStateItem(id, 'a1')
    const forA2 = await getStateItem(id, 'a2')
    const anonymous = await getStateItem(id)
    expect(forA1.saved).toBe(true)
    expect(forA2.saved).toBe(false)
    expect(anonymous.saved).toBe(false)
    expect((await toggleSavedEvent({ eventId: id, accountId: 'a1' })).saved).toBe(false)
  })

  it('só eventos podem ser salvos', async () => {
    const news = (await listStateItems()).find((i) => i.kind === 'news')
    await expect(
      toggleSavedEvent({ eventId: news.id, accountId: 'a1' }),
    ).rejects.toMatchObject({ code: 'not_found' })
  })

  it('excluir a conta apaga os eventos salvos dela e preserva os de outras', async () => {
    const id = await eventId()
    await toggleSavedEvent({ eventId: id, accountId: 'a1' })
    await toggleSavedEvent({ eventId: id, accountId: 'a2' })
    deleteAccountSavedEvents('a1')
    expect((await getStateItem(id, 'a1')).saved).toBe(false)
    expect((await getStateItem(id, 'a2')).saved).toBe(true)
  })
})
