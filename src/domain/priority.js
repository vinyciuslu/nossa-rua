import { HOURS } from './relativeTime.js'
import { getCategory } from './reportCategories.js'
import { isClosedStatus } from './reportStatus.js'

/**
 * Prioridade da fila de ocorrências da administração.
 *
 * Três índices, todos de 0 a 100 e todos mostrados na tela:
 *
 *  1. Urgência: vem da categoria (risco de queda ou alagamento pesa mais que lixo).
 *     alta = 90, média = 60, baixa = 30.
 *  2. Espera: há quanto tempo o relato está aberto, comparado ao PRAZO DE
 *     REFERÊNCIA do nível (24 h, 72 h ou 7 dias). 100 = chegou ao prazo.
 *  3. Apoio: quantos moradores confirmaram o relato (20 apoios = 100).
 *
 * Pontuação = índice de urgência + bônus, e o bônus (15% da espera + 10% do apoio)
 * é LIMITADO a +15. Como os níveis de urgência estão 30 pontos distantes, o nível
 * sempre vem primeiro: um relato de baixa urgência, por mais antigo e apoiado que
 * seja, nunca passa à frente de um de média. Espera e apoio só desempatam dentro
 * do nível, e é isso que impede que "quem está há mais tempo" esconda o que é grave.
 *
 * Os prazos são referências internas fictícias do protótipo, não compromissos de
 * nenhum órgão.
 */

export const URGENCY_LEVELS = {
  high: { label: 'Alta', index: 90, slaHours: 24 },
  medium: { label: 'Média', index: 60, slaHours: 72 },
  low: { label: 'Baixa', index: 30, slaHours: 168 },
}

export const SUPPORT_FULL = 20
export const MAX_BONUS = 15
const WAITING_WEIGHT = 0.15
const SUPPORT_WEIGHT = 0.1

/**
 * @param {object} report  relato já apresentado: category, createdAt, supports, status, events
 * @param {Date} now
 */
export function priorityOf(report, now) {
  const level = getCategory(report.category).urgency
  const { index: urgencyIndex, slaHours } = URGENCY_LEVELS[level]

  // Relato encerrado para de "esperar" no momento em que foi encerrado.
  const closed = isClosedStatus(report.status)
  const endMs = closed ? new Date(report.events.at(-1).at).getTime() : now.getTime()
  const waitedHours = Math.max(0, (endMs - new Date(report.createdAt).getTime()) / HOURS)

  const waitingIndex = Math.min(100, Math.round((waitedHours / slaHours) * 100))
  const supportIndex = Math.min(
    100,
    Math.round(((report.supports ?? 0) / SUPPORT_FULL) * 100),
  )
  const rawBonus = Math.round(
    WAITING_WEIGHT * waitingIndex + SUPPORT_WEIGHT * supportIndex,
  )
  const bonus = Math.min(MAX_BONUS, rawBonus)

  return {
    level,
    urgencyIndex,
    waitedHours,
    slaHours,
    waitingIndex,
    supportIndex,
    rawBonus,
    bonus,
    score: urgencyIndex + bonus,
    overdue: !closed && waitedHours > slaHours,
    closed,
  }
}

/** Maior pontuação primeiro; empate: o relato mais antigo; depois o id, para ser estável. */
export function compareByPriority(a, b) {
  return (
    b.priority.score - a.priority.score ||
    new Date(a.createdAt) - new Date(b.createdAt) ||
    a.id.localeCompare(b.id)
  )
}

/** Números da visão geral. `items` já têm `priority`. */
export function summarizeQueue(items) {
  const open = items.filter((i) => !i.priority.closed)
  const count = (level) => open.filter((i) => i.priority.level === level).length
  return {
    open: open.length,
    overdue: open.filter((i) => i.priority.overdue).length,
    byLevel: { high: count('high'), medium: count('medium'), low: count('low') },
    closed: items.length - open.length,
    averageWaitHours: open.length
      ? open.reduce((sum, i) => sum + i.priority.waitedHours, 0) / open.length
      : 0,
  }
}
