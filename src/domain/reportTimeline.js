import { planStatusPath } from './statusSimulation.js'

/**
 * Linha do tempo de um relato: simulação + ações da administração.
 *
 * Enquanto ninguém da administração mexeu, a linha do tempo é a SIMULADA (ver
 * statusSimulation.js). Na primeira ação manual a simulação daquele relato para:
 * ficam as etapas simuladas que já tinham acontecido até esse momento e, dali em
 * diante, só valem as ações da administração. Assim a pessoa nunca vê uma etapa
 * simulada "contradizendo" o que a administração registrou.
 *
 * @param {object} post         relato (id, createdAt)
 * @param {object[]} adminEvents ações: { status, at (ISO), by: 'admin', note, simulated: false }
 * @param {Date} now
 * @returns eventos em ordem cronológica, com `at` em ISO
 */
export function buildTimeline(post, adminEvents, now) {
  const nowMs = now.getTime()
  const planned = planStatusPath(post)
  const admin = [...adminEvents].sort((a, b) => new Date(a.at) - new Date(b.at))
  const takeoverMs = admin.length ? new Date(admin[0].at).getTime() : Infinity

  const kept = planned.filter(
    (e) => e.at.getTime() <= nowMs && e.at.getTime() <= takeoverMs,
  )
  const manual = admin.filter((e) => new Date(e.at).getTime() <= nowMs)

  return [...kept.map((e) => ({ ...e, at: e.at.toISOString() })), ...manual]
}
