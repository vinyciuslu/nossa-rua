import { fractionOfVertex, pointAtFraction } from './geo.js'
import { localTime, startOfLocalDay } from './traffic.js'

/**
 * Ônibus SIMULADOS em linhas circulares.
 *
 * A posição de cada ônibus é uma função pura do horário: o progresso da linha é a
 * soma, de 5 em 5 minutos, da velocidade de cada instante (que depende do
 * trânsito dos trechos da linha). Assim os ônibus andam de forma contínua,
 * desaceleram nos picos e a previsão de chegada também sofre com o trânsito.
 */

const MINUTE = 60_000
const STEP_MS = 5 * MINUTE

/** Horário de operação das linhas (hora local de São Paulo). */
export const SERVICE_HOURS = { from: 5, to: 23.5 }

export function isInService(now) {
  const { hour } = localTime(now)
  return hour >= SERVICE_HOURS.from && hour < SERVICE_HOURS.to
}

const serviceStartMs = (now) => startOfLocalDay(now) + SERVICE_HOURS.from * 60 * MINUTE

/**
 * Quanto da velocidade normal o ônibus mantém, dada a velocidade do trânsito
 * (como fração). Parado nunca fica: ônibus sofre menos que o carro (corredor, faixa).
 */
export const busSpeedFactor = (trafficRatio) => 0.3 + 0.7 * trafficRatio

/** Percurso pronto da linha: acrescenta as frações de cada ponto de parada. */
export function withStopFractions(line, path) {
  return {
    ...line,
    stops: line.stops.map((stop) => ({
      ...stop,
      fraction: fractionOfVertex(path, stop.vertexIndex),
    })),
  }
}

/**
 * Quantas voltas completas a linha já deu hoje (fração: 2,35 = duas voltas e 35%).
 * `ratioAt(ms)` devolve o trânsito médio dos trechos da linha naquele instante.
 */
export function lineProgress(line, ratioAt, now) {
  const cycleMs = line.cycleMinutes * MINUTE
  const start = serviceStartMs(now)
  const end = now.getTime()
  let progress = 0
  for (let t = start; t < end; t += STEP_MS) {
    const stepEnd = Math.min(t + STEP_MS, end)
    const middle = (t + stepEnd) / 2
    progress += ((stepEnd - t) / cycleMs) * busSpeedFactor(ratioAt(middle))
  }
  return progress
}

/** Ônibus da linha agora: espaçados igualmente ao longo do percurso. */
export function busesOf(line, path, progress) {
  return Array.from({ length: line.busCount }, (_, i) => {
    const fraction = (((progress + i / line.busCount) % 1) + 1) % 1
    return {
      id: `${line.id}-${i + 1}`,
      number: i + 1,
      fraction,
      position: pointAtFraction(path, fraction),
    }
  })
}

/**
 * Próximos ônibus a chegar a uma parada, do mais perto ao mais longe.
 * `currentRatio` é o trânsito de agora: a previsão supõe que ele continua assim.
 */
export function arrivalsAt(line, stop, buses, currentRatio, limit = 3) {
  const cycleMs = line.cycleMinutes * MINUTE
  const speed = busSpeedFactor(currentRatio)
  return buses
    .map((bus) => {
      const remaining = (((stop.fraction - bus.fraction) % 1) + 1) % 1
      return {
        busId: bus.id,
        busNumber: bus.number,
        etaMs: (remaining * cycleMs) / speed,
      }
    })
    .sort((a, b) => a.etaMs - b.etaMs)
    .slice(0, limit)
}

/** "chegando" (menos de 1 min), "em 4 min" ou "em 1 h 10 min". */
export function formatEta(etaMs) {
  const minutes = Math.round(etaMs / MINUTE)
  if (etaMs < MINUTE) return 'chegando'
  if (minutes < 60) return `em ${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `em ${h} h` : `em ${h} h ${m} min`
}
