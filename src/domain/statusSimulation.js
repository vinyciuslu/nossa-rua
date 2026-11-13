import { HOURS } from './relativeTime.js'
import { createRng } from './random.js'

/**
 * Ciclo de status SIMULADO de um relato.
 *
 * Na versão de demonstração ninguém de fato analisa os relatos. Para o cidadão
 * poder ver como o acompanhamento funcionaria, o app gera um percurso plausível
 * a partir do id do relato (mesmo id, mesmo percurso) e o revela com o passar do
 * tempo. Todo evento gerado aqui sai marcado `simulated: true`, e a interface
 * mostra isso em cada etapa.
 *
 * É uma função pura de (relato, agora): nada é gravado. Avançar o relógio de
 * demonstração faz mais etapas aparecerem.
 */

// Intervalo (em horas) entre uma etapa e a anterior.
const DELAYS = {
  in_review: [2, 20],
  forwarded: [6, 48],
  in_progress: [12, 72],
  resolved: [24, 168],
  not_applicable: [12, 72],
}

// Onde cada relato termina (probabilidades somam 1). Nem tudo é resolvido, e
// isso também faz parte da transparência.
const FINAL_STATUS = [
  ['received', 0.1],
  ['in_review', 0.15],
  ['forwarded', 0.1],
  ['in_progress', 0.2],
  ['resolved', 0.37],
  ['not_applicable', 0.08],
]

const NOTES = {
  in_review: 'Simulação: a moderação de demonstração conferiu as informações.',
  forwarded: 'Simulação: encaminhamento fictício. Nenhum órgão público foi acionado.',
  in_progress: 'Simulação: o registro indica que o problema está em tratamento.',
  resolved: 'Simulação: o registro indica que o problema foi resolvido.',
  not_applicable:
    'Simulação: a moderação de demonstração marcou o relato como não procedente.',
}

const PATH = ['in_review', 'forwarded', 'in_progress', 'resolved']

function pickFinal(rng) {
  let roll = rng()
  for (const [status, weight] of FINAL_STATUS) {
    if (roll < weight) return status
    roll -= weight
  }
  return 'received'
}

const between = (rng, [min, max]) => (min + rng() * (max - min)) * HOURS

/** Percurso completo (inclusive o futuro), com os horários de cada etapa. */
export function planStatusPath({ id, createdAt }) {
  const rng = createRng(`status:${id}`)
  const final = pickFinal(rng)
  const events = [{ status: 'received', at: new Date(createdAt), by: 'author' }]
  if (final === 'received') return events

  let steps
  if (final === 'not_applicable') {
    steps = ['in_review', 'not_applicable']
  } else {
    steps = PATH.slice(0, PATH.indexOf(final) + 1)
    // "Encaminhamento registrado" nem sempre existe: às vezes a etapa é pulada
    // e a linha do tempo mostra "Etapa não registrada".
    if (final !== 'forwarded' && rng() < 0.25) {
      steps = steps.filter((s) => s !== 'forwarded')
    }
  }

  let at = events[0].at.getTime()
  for (const status of steps) {
    at += between(rng, DELAYS[status])
    events.push({
      status,
      at: new Date(at),
      by: 'moderation',
      note: NOTES[status],
      simulated: true,
    })
  }
  return events
}

/** Eventos já ocorridos em `now`, com datas em ISO. */
export function simulateStatusEvents(post, now) {
  return planStatusPath(post)
    .filter((e) => e.at.getTime() <= now.getTime())
    .map((e) => ({ ...e, at: e.at.toISOString() }))
}
