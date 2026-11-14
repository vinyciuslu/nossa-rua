import { describe, expect, it } from 'vitest'
import { buildTimeline } from './reportTimeline.js'
import { planStatusPath } from './statusSimulation.js'

// Procura relatos cujo percurso simulado chega a "resolvida" (tem várias etapas para testar).
function findPost() {
  for (let i = 0; i < 300; i++) {
    const post = { id: `teste-${i}`, createdAt: '2026-11-01T12:00:00.000Z' }
    const plan = planStatusPath(post)
    if (plan.at(-1).status === 'resolved' && plan.length >= 4) return { post, plan }
  }
  throw new Error('nenhum relato de teste encontrado')
}

const { post, plan } = findPost()
const ms = (e) => e.at.getTime()
const end = new Date(ms(plan.at(-1)) + 24 * 3_600_000) // depois de toda a simulação

describe('buildTimeline', () => {
  it('sem ações da administração é a linha do tempo simulada', () => {
    const timeline = buildTimeline(post, [], end)
    expect(timeline.map((e) => e.status)).toEqual(plan.map((e) => e.status))
    expect(timeline.slice(1).every((e) => e.simulated === true)).toBe(true)
  })

  it('a simulação só revela o que já aconteceu', () => {
    const now = new Date(ms(plan[1]) + 1000)
    expect(buildTimeline(post, [], now).map((e) => e.status)).toEqual(
      plan.slice(0, 2).map((e) => e.status),
    )
  })

  it('a primeira ação manual interrompe a simulação daquele relato', () => {
    // a administração age logo depois da 2ª etapa simulada
    const actAt = new Date(ms(plan[1]) + 60_000)
    const admin = [
      {
        status: 'forwarded',
        at: actAt.toISOString(),
        by: 'admin',
        note: 'x',
        simulated: false,
      },
    ]
    const timeline = buildTimeline(post, admin, end)
    expect(timeline.map((e) => e.status)).toEqual([
      ...plan.slice(0, 2).map((e) => e.status),
      'forwarded',
    ])
    // as etapas simuladas que viriam depois não aparecem, mesmo com o relógio à frente
    expect(timeline.at(-1).by).toBe('admin')
    expect(timeline.at(-1).simulated).toBe(false)
  })

  it('mantém as etapas simuladas anteriores à ação, ainda marcadas como simuladas', () => {
    const actAt = new Date(ms(plan[1]) + 60_000)
    const timeline = buildTimeline(
      post,
      [{ status: 'resolved', at: actAt.toISOString(), by: 'admin', simulated: false }],
      end,
    )
    expect(timeline[1].simulated).toBe(true)
    expect(timeline.at(-1).status).toBe('resolved')
  })

  it('várias ações ficam em ordem cronológica', () => {
    const t1 = new Date(ms(plan[1]) + 60_000)
    const t2 = new Date(t1.getTime() + 3_600_000)
    const timeline = buildTimeline(
      post,
      [
        { status: 'resolved', at: t2.toISOString(), by: 'admin', simulated: false },
        { status: 'in_progress', at: t1.toISOString(), by: 'admin', simulated: false },
      ],
      end,
    )
    expect(timeline.slice(-2).map((e) => e.status)).toEqual(['in_progress', 'resolved'])
  })

  it('ação "no futuro" (o relógio voltou) não aparece ainda', () => {
    const future = new Date(end.getTime() + 3_600_000)
    const timeline = buildTimeline(
      post,
      [{ status: 'resolved', at: future.toISOString(), by: 'admin', simulated: false }],
      end,
    )
    expect(timeline.some((e) => e.by === 'admin')).toBe(false)
  })

  it('o primeiro evento é sempre a publicação pelo morador', () => {
    expect(buildTimeline(post, [], end)[0]).toMatchObject({
      status: 'received',
      by: 'author',
    })
  })
})
