import { can } from '../domain/account.js'
import { makeStatusUpdateSchema, noticeSchema } from '../domain/adminSchemas.js'
import { compareByPriority, priorityOf } from '../domain/priority.js'
import { createId } from '../utils/id.js'
import { clock } from './clock.js'
import { wait } from './latency.js'
import {
  addNotice,
  listAllReports,
  listCreatedNotices,
  recordAdminStatus,
  removeNotice,
} from './postService.js'
import { ServiceError } from './ServiceError.js'
import { resetTrafficThresholds, saveTrafficThresholds } from './settingsService.js'

/**
 * Operações da administração. Cada função confere de novo que quem chama é
 * administrador e valida os dados: o serviço não confia na tela, como faria um
 * backend. (No protótipo isso é só organização, não segurança: tudo vive no navegador.)
 */

function requireAdmin(admin) {
  if (!can(admin, 'access_admin')) {
    throw new ServiceError('forbidden', 'Apenas a administração pode fazer isso.')
  }
}

const withPriority = (report, now) => ({ ...report, priority: priorityOf(report, now) })

/** Todos os relatos com a prioridade calculada, do mais prioritário ao menos. */
export async function listAdminReports(admin) {
  await wait()
  requireAdmin(admin)
  const now = clock.now()
  return listAllReports()
    .map((r) => withPriority(r, now))
    .sort(compareByPriority)
}

export async function getAdminReport(admin, id) {
  await wait()
  requireAdmin(admin)
  const report = listAllReports().find((r) => r.id === id)
  if (!report) throw new ServiceError('not_found', 'Não encontramos esse relato.')
  return withPriority(report, clock.now())
}

/**
 * Leva o relato para uma etapa seguinte do ciclo. A nota é pública: o morador a
 * vê na linha do tempo. A ação para a simulação automática deste relato.
 */
export async function updateReportStatus({ admin, postId, status, note = '' }) {
  await wait()
  requireAdmin(admin)
  const report = listAllReports().find((r) => r.id === postId)
  if (!report) throw new ServiceError('not_found', 'Não encontramos esse relato.')

  const parsed = makeStatusUpdateSchema(report.status).safeParse({ status, note })
  if (!parsed.success) throw new ServiceError('invalid', parsed.error.issues[0].message)

  const now = clock.now()
  recordAdminStatus(postId, {
    status: parsed.data.status,
    at: now.toISOString(),
    by: 'admin',
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
    simulated: false,
  })
  const updated = listAllReports().find((r) => r.id === postId)
  return withPriority(updated, now)
}

/** Avisos publicados pela administração, do mais novo ao mais antigo. */
export async function listAdminNotices(admin) {
  await wait()
  requireAdmin(admin)
  return listCreatedNotices().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
}

/** Publica um aviso oficial (da moderação) para um bairro ou para o município inteiro. */
export async function publishNotice({ admin, ...values }) {
  await wait()
  requireAdmin(admin)
  const parsed = noticeSchema.safeParse(values)
  if (!parsed.success) throw new ServiceError('invalid', parsed.error.issues[0].message)
  const { level, title, description, scope, cityId, neighborhoodId } = parsed.data
  return addNotice({
    id: createId('notice'),
    type: 'notice',
    authorId: admin.id,
    ...(scope === 'city' ? { cityId } : { neighborhoodId }),
    createdAt: clock.now().toISOString(),
    title,
    description,
    level,
    source: 'moderation',
  })
}

export async function retireNotice({ admin, noticeId }) {
  await wait()
  requireAdmin(admin)
  if (!removeNotice(noticeId)) {
    throw new ServiceError('not_found', 'Esse aviso não existe mais.')
  }
}

/** Altera os limites do trânsito. Valida de novo: o serviço não confia na tela. */
export async function updateTrafficThresholds({ admin, freeFrom, heavyBelow }) {
  await wait()
  requireAdmin(admin)
  const error = saveTrafficThresholds({ freeFrom, heavyBelow })
  if (error) throw new ServiceError('invalid', error)
}

export async function restoreTrafficThresholds(admin) {
  await wait()
  requireAdmin(admin)
  resetTrafficThresholds()
}
