import { beforeEach, describe, expect, it } from 'vitest'
import { clock } from './clock.js'
import { getPost, listPosts, toggleSupport } from './postService.js'

const HOUR = 3_600_000
const NEIGHBORHOOD = 'sao-paulo/pinheiros'

beforeEach(() => clock.reset())

describe('listPosts', () => {
  it('devolve só as publicações dos bairros pedidos', async () => {
    const posts = await listPosts({ neighborhoodIds: [NEIGHBORHOOD] })
    expect(posts.length).toBeGreaterThanOrEqual(3)
    expect(posts.every((p) => p.neighborhoodId === NEIGHBORHOOD)).toBe(true)
    const two = await listPosts({ neighborhoodIds: [NEIGHBORHOOD, 'santos/gonzaga'] })
    expect(two.length).toBeGreaterThan(posts.length)
  })

  it('relatos trazem status atual, eventos simulados e autor em forma anônima', async () => {
    const reports = (await listPosts({ neighborhoodIds: [NEIGHBORHOOD] })).filter(
      (p) => p.type === 'report',
    )
    for (const r of reports) {
      expect(r.events[0]).toMatchObject({ status: 'received', by: 'author' })
      expect(r.status).toBe(r.events.at(-1).status)
      expect(r.authorLabel).toBe('Morador(a) de Pinheiros')
      expect(r.simulated).toBe(true)
    }
  })

  it('adiantar o relógio faz o ciclo dos relatos avançar', async () => {
    const count = async () =>
      (
        await listPosts({
          neighborhoodIds: [NEIGHBORHOOD, 'santos/gonzaga', 'campinas/cambui'],
        })
      )
        .filter((p) => p.type === 'report')
        .reduce((total, r) => total + r.events.length, 0)
    const before = await count()
    clock.advance(60 * 24 * HOUR)
    expect(await count()).toBeGreaterThan(before)
  })

  it('o ciclo é estável entre chamadas (mesmo instante, mesmo resultado)', async () => {
    const a = await listPosts({ neighborhoodIds: [NEIGHBORHOOD] })
    const b = await listPosts({ neighborhoodIds: [NEIGHBORHOOD] })
    expect(a.map((p) => p.events)).toEqual(b.map((p) => p.events))
  })
})

describe('apoios', () => {
  async function firstReport() {
    return (await listPosts({ neighborhoodIds: [NEIGHBORHOOD] })).find(
      (p) => p.type === 'report',
    )
  }

  it('apoiar soma 1 e marca como apoiado só para quem apoiou; apoiar de novo retira', async () => {
    const report = await firstReport()
    const after = await toggleSupport({ postId: report.id, accountId: 'acc_a' })
    expect(after.supports).toBe(report.supports + 1)
    expect(after.supported).toBe(true)

    const forOther = await getPost(report.id, 'acc_b')
    expect(forOther.supports).toBe(report.supports + 1)
    expect(forOther.supported).toBe(false)

    const undone = await toggleSupport({ postId: report.id, accountId: 'acc_a' })
    expect(undone.supports).toBe(report.supports)
    expect(undone.supported).toBe(false)
  })

  it('a mesma conta não apoia duas vezes', async () => {
    const report = await firstReport()
    await toggleSupport({ postId: report.id, accountId: 'acc_a' })
    const again = await getPost(report.id, 'acc_a')
    expect(again.supports).toBe(report.supports + 1)
  })

  it('só relatos recebem apoio; id inexistente dá erro claro', async () => {
    const notice = (
      await listPosts({
        neighborhoodIds: [
          'sao-paulo/pinheiros',
          'sao-paulo/mooca',
          'sao-paulo/lapa',
          'sao-paulo/santana',
        ],
      })
    ).find((p) => p.type === 'notice')
    await expect(
      toggleSupport({ postId: notice.id, accountId: 'x' }),
    ).rejects.toMatchObject({ code: 'not_found' })
    await expect(getPost('nao-existe')).rejects.toMatchObject({ code: 'not_found' })
  })
})
