import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_ACCOUNTS } from '../config/demoAccounts.js'
import { goToLocalHour } from '../test/clockHelpers.js'
import {
  getAdminReport,
  listAdminNotices,
  listAdminReports,
  publishNotice,
  restoreTrafficThresholds,
  retireNotice,
  updateReportStatus,
  updateTrafficThresholds,
} from './adminService.js'
import { clock } from './clock.js'
import { getMobilitySnapshot } from './mobilityService.js'
import { getPost, listPosts } from './postService.js'
import { getTrafficThresholds } from './settingsService.js'

const admin = DEMO_ACCOUNTS.admin
const resident = { id: 'acc_x', type: 'cpf' }

beforeEach(() => clock.reset())

/** Primeiro relato ainda aberto da fila (tem de onde avançar). */
async function openReport() {
  const reports = await listAdminReports(admin)
  return reports.find((r) => !r.priority.closed && r.status === 'received')
}

describe('permissão', () => {
  it('só administração pode usar as operações', async () => {
    await expect(listAdminReports(resident)).rejects.toMatchObject({ code: 'forbidden' })
    await expect(listAdminReports(null)).rejects.toMatchObject({ code: 'forbidden' })
    await expect(
      updateReportStatus({ admin: resident, postId: 'x', status: 'in_review' }),
    ).rejects.toMatchObject({ code: 'forbidden' })
    await expect(
      publishNotice({ admin: resident, title: 'Aviso qualquer' }),
    ).rejects.toMatchObject({ code: 'forbidden' })
    await expect(
      updateTrafficThresholds({ admin: resident, freeFrom: 80, heavyBelow: 30 }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })
})

describe('fila de ocorrências', () => {
  it('lista os relatos de todos os bairros, do mais prioritário ao menos', async () => {
    const reports = await listAdminReports(admin)
    expect(reports.length).toBeGreaterThan(20)
    expect(new Set(reports.map((r) => r.neighborhoodId)).size).toBeGreaterThan(10)
    for (let i = 1; i < reports.length; i++) {
      expect(reports[i - 1].priority.score).toBeGreaterThanOrEqual(
        reports[i].priority.score,
      )
    }
    expect(reports.every((r) => r.type === 'report')).toBe(true)
  })

  it('o nível de urgência manda: nenhum relato de nível menor vem antes de um de nível maior', async () => {
    const reports = await listAdminReports(admin)
    const rank = { high: 0, medium: 1, low: 2 }
    for (let i = 1; i < reports.length; i++) {
      expect(rank[reports[i - 1].priority.level]).toBeLessThanOrEqual(
        rank[reports[i].priority.level],
      )
    }
  })

  it('getAdminReport devolve o relato com a prioridade, e not_found para id errado', async () => {
    const [first] = await listAdminReports(admin)
    expect((await getAdminReport(admin, first.id)).priority.score).toBe(
      first.priority.score,
    )
    await expect(getAdminReport(admin, 'nao-existe')).rejects.toMatchObject({
      code: 'not_found',
    })
  })
})

describe('updateReportStatus', () => {
  it('registra a ação na linha do tempo, sem marcar como simulada', async () => {
    const report = await openReport()
    const updated = await updateReportStatus({
      admin,
      postId: report.id,
      status: 'in_review',
      note: 'Equipe conferiu as fotos.',
    })
    expect(updated.status).toBe('in_review')
    const last = updated.events.at(-1)
    expect(last).toMatchObject({
      status: 'in_review',
      by: 'admin',
      simulated: false,
      note: 'Equipe conferiu as fotos.',
    })
  })

  it('o morador vê a mesma atualização no relato', async () => {
    const report = await openReport()
    await updateReportStatus({ admin, postId: report.id, status: 'in_progress' })
    const seen = await getPost(report.id)
    expect(seen.status).toBe('in_progress')
    expect(seen.events.at(-1).by).toBe('admin')
  })

  it('para a simulação automática do relato: o relógio à frente não muda mais nada', async () => {
    const report = await openReport()
    await updateReportStatus({ admin, postId: report.id, status: 'in_review' })
    clock.advance(400 * 24 * 3_600_000) // mais de um ano: a simulação já teria terminado
    const later = await getPost(report.id)
    expect(later.status).toBe('in_review')
    expect(
      later.events.filter((e) => e.simulated).every((e) => e.status !== 'resolved'),
    ).toBe(true)
  })

  it('exige justificativa pública para "Não procedente"', async () => {
    const report = await openReport()
    await expect(
      updateReportStatus({
        admin,
        postId: report.id,
        status: 'not_applicable',
        note: '',
      }),
    ).rejects.toMatchObject({ code: 'invalid' })
    const done = await updateReportStatus({
      admin,
      postId: report.id,
      status: 'not_applicable',
      note: 'Não foi possível confirmar o problema no endereço.',
    })
    expect(done.priority.closed).toBe(true)
  })

  it('não deixa voltar etapa nem mexer em relato encerrado', async () => {
    const report = await openReport()
    await updateReportStatus({ admin, postId: report.id, status: 'in_progress' })
    await expect(
      updateReportStatus({ admin, postId: report.id, status: 'in_review' }),
    ).rejects.toMatchObject({ code: 'invalid' })
    await updateReportStatus({ admin, postId: report.id, status: 'resolved' })
    await expect(
      updateReportStatus({ admin, postId: report.id, status: 'in_progress' }),
    ).rejects.toMatchObject({ code: 'invalid' })
  })

  it('um relato encerrado sai da fila de abertos e para de esperar', async () => {
    const report = await openReport()
    const closed = await updateReportStatus({
      admin,
      postId: report.id,
      status: 'resolved',
    })
    const waited = closed.priority.waitedHours
    clock.advance(200 * 3_600_000)
    expect((await getAdminReport(admin, report.id)).priority.waitedHours).toBeCloseTo(
      waited,
      6,
    )
  })

  it('relato inexistente dá not_found', async () => {
    await expect(
      updateReportStatus({ admin, postId: 'nao-existe', status: 'in_review' }),
    ).rejects.toMatchObject({ code: 'not_found' })
  })
})

describe('avisos', () => {
  const base = {
    level: 'attention',
    title: 'Obra com interdição',
    description: 'Haverá interdição parcial durante a madrugada.',
    scope: 'neighborhood',
    cityId: '',
    neighborhoodId: 'sao-paulo/pinheiros',
  }

  it('publica aviso de bairro, que aparece no feed daquele bairro e só nele', async () => {
    const notice = await publishNotice({ admin, ...base })
    expect(notice).toMatchObject({
      type: 'notice',
      source: 'moderation',
      simulated: false,
    })
    const inPinheiros = await listPosts({ neighborhoodIds: ['sao-paulo/pinheiros'] })
    expect(inPinheiros.some((p) => p.id === notice.id)).toBe(true)
    const inMooca = await listPosts({ neighborhoodIds: ['sao-paulo/mooca'] })
    expect(inMooca.some((p) => p.id === notice.id)).toBe(false)
  })

  it('aviso de município inteiro aparece para quem acompanha qualquer bairro dele', async () => {
    const notice = await publishNotice({
      admin,
      ...base,
      scope: 'city',
      cityId: 'campinas',
      neighborhoodId: '',
    })
    expect(notice.neighborhoodId).toBeUndefined()
    const campinas = await listPosts({ neighborhoodIds: ['campinas/centro'] })
    expect(campinas.some((p) => p.id === notice.id)).toBe(true)
    const outraCidade = await listPosts({ neighborhoodIds: ['santos/gonzaga'] })
    expect(outraCidade.some((p) => p.id === notice.id)).toBe(false)
  })

  it('valida os dados de novo', async () => {
    await expect(publishNotice({ admin, ...base, title: 'abc' })).rejects.toMatchObject({
      code: 'invalid',
    })
  })

  it('lista os avisos da administração, do mais novo ao mais antigo, e permite retirar', async () => {
    const first = await publishNotice({ admin, ...base, title: 'Primeiro aviso' })
    clock.advance(3_600_000)
    const second = await publishNotice({ admin, ...base, title: 'Segundo aviso' })
    const list = await listAdminNotices(admin)
    expect(list.map((n) => n.id)).toEqual([second.id, first.id])

    await retireNotice({ admin, noticeId: first.id })
    expect((await listAdminNotices(admin)).map((n) => n.id)).toEqual([second.id])
    await expect(retireNotice({ admin, noticeId: first.id })).rejects.toMatchObject({
      code: 'not_found',
    })
  })
})

describe('limites do trânsito', () => {
  it('começam em 75% e 40%', () => {
    expect(getTrafficThresholds()).toEqual({ freeFrom: 75, heavyBelow: 40 })
  })

  it('a administração altera, e o mapa passa a usar os novos limites', async () => {
    await updateTrafficThresholds({ admin, freeFrom: 90, heavyBelow: 60 })
    expect(getTrafficThresholds()).toEqual({ freeFrom: 90, heavyBelow: 60 })
    goToLocalHour(12)
    const snap = await getMobilitySnapshot('sao-paulo')
    expect(snap.thresholds).toEqual({ freeFrom: 90, heavyBelow: 60 })
  })

  it('recusa limites sem sentido', async () => {
    await expect(
      updateTrafficThresholds({ admin, freeFrom: 30, heavyBelow: 50 }),
    ).rejects.toMatchObject({ code: 'invalid' })
    expect(getTrafficThresholds()).toEqual({ freeFrom: 75, heavyBelow: 40 })
  })

  it('restaura o padrão', async () => {
    await updateTrafficThresholds({ admin, freeFrom: 90, heavyBelow: 60 })
    await restoreTrafficThresholds(admin)
    expect(getTrafficThresholds()).toEqual({ freeFrom: 75, heavyBelow: 40 })
  })
})
