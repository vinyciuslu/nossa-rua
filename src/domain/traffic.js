import { createRng } from './random.js'

/**
 * Trânsito estimado por sensores SIMULADOS.
 *
 * Cada trecho tem um sensor com velocidade livre (`freeFlowKmh`) e dois "perfis
 * de pico" (manhã e tarde, de 0 a 1). A leitura é uma função pura de (sensor,
 * hora): curva do dia + ruído com semente. Sem aleatoriedade solta, o mesmo
 * instante dá sempre a mesma leitura, e o relógio de demonstração faz o trânsito
 * andar sem esperar.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** Percentuais da velocidade normal. Os limites são parâmetros: a administração poderá ajustá-los. */
export const DEFAULT_THRESHOLDS = { freeFrom: 75, heavyBelow: 40 }

/** Texto de erro se os limites não fazem sentido; null se estiverem corretos. */
export function validateThresholds({ freeFrom, heavyBelow }) {
  const ok = (n) => Number.isFinite(n) && n > 0 && n < 100
  if (!ok(freeFrom) || !ok(heavyBelow)) return 'Use percentuais entre 1 e 99.'
  if (heavyBelow >= freeFrom) {
    return 'O limite de congestionamento deve ser menor que o de trânsito livre.'
  }
  return null
}

/** free, moderate ou heavy, a partir da velocidade como % da normal. */
export function classifyTraffic(percent, thresholds = DEFAULT_THRESHOLDS) {
  if (percent >= thresholds.freeFrom) return 'free'
  if (percent < thresholds.heavyBelow) return 'heavy'
  return 'moderate'
}

// Fuso fixo de São Paulo (sem horário de verão desde 2019), para a hora do dia
// não depender do fuso do aparelho.
const SAO_PAULO_OFFSET_MS = -3 * HOUR
const DAY = 24 * HOUR

/** Hora local de São Paulo como número (14.5 = 14h30) e se é fim de semana. */
export function localTime(now) {
  const shifted = new Date(now.getTime() + SAO_PAULO_OFFSET_MS)
  const weekday = shifted.getUTCDay() // 0 = domingo, 6 = sábado
  return {
    hour: shifted.getUTCHours() + shifted.getUTCMinutes() / 60,
    weekend: weekday === 0 || weekday === 6,
  }
}

/** Meia-noite local de São Paulo do dia de `now`, em ms UTC. */
export function startOfLocalDay(now) {
  const t = now.getTime()
  return Math.floor((t + SAO_PAULO_OFFSET_MS) / DAY) * DAY - SAO_PAULO_OFFSET_MS
}

const bump = (hour, center, width) => Math.exp(-(((hour - center) / width) ** 2))
const smoothstep = (x) => x * x * (3 - 2 * x)

/** Quanto o trecho está carregado (0 a 1) naquela hora. */
function loadAt(sensor, { hour, weekend }) {
  const peaks =
    sensor.morning * bump(hour, 8, 1.4) +
    sensor.evening * bump(hour, 18, 1.6) +
    0.2 * bump(hour, 13, 2.5)
  return Math.min(1, weekend ? peaks * 0.4 : peaks)
}

/** Ruído suave entre -1 e 1: um valor novo a cada 5 min, com transição suave. */
function noiseAt(seed, timeMs) {
  const bucket = Math.floor(timeMs / (5 * MINUTE))
  const frac = (timeMs - bucket * 5 * MINUTE) / (5 * MINUTE)
  const at = (b) => createRng(`${seed}:${b}`)() * 2 - 1
  const t = smoothstep(frac)
  return at(bucket) * (1 - t) + at(bucket + 1) * t
}

/** Velocidade real como fração (0,12 a 1) da normal. Os ônibus andam por ela, mesmo se o sensor estiver fora. */
export function trafficRatio(sensor, timeMs) {
  const load = loadAt(sensor, localTime(new Date(timeMs)))
  const ratio = 1 - 0.85 * load + 0.08 * noiseAt(sensor.id, timeMs)
  return Math.min(1, Math.max(0.12, ratio))
}

const SAMPLE_MS = MINUTE // o sensor "mede" uma vez por minuto
const OFFLINE_WINDOW_MS = 30 * MINUTE
const OFFLINE_CHANCE = 0.05

/**
 * Leitura do sensor no instante `now`. De vez em quando o sensor fica sem sinal
 * por 30 min: nesse caso não há velocidade nenhuma, e a tela diz "sem leitura"
 * em vez de inventar um número.
 */
export function sensorReading(sensor, now, thresholds = DEFAULT_THRESHOLDS) {
  const sampleTime = Math.floor(now.getTime() / SAMPLE_MS) * SAMPLE_MS
  const updatedAt = new Date(sampleTime).toISOString()
  const windowIndex = Math.floor(sampleTime / OFFLINE_WINDOW_MS)
  const offline = createRng(`${sensor.id}:offline:${windowIndex}`)() < OFFLINE_CHANCE
  if (offline) {
    return {
      status: 'offline',
      level: 'unknown',
      speedKmh: null,
      percent: null,
      updatedAt,
    }
  }
  const ratio = trafficRatio(sensor, sampleTime)
  const percent = Math.round(ratio * 100)
  return {
    status: 'ok',
    level: classifyTraffic(percent, thresholds),
    speedKmh: Math.round(ratio * sensor.freeFlowKmh),
    percent,
    updatedAt,
  }
}

/** Do mais grave para o mais leve; "sem leitura" por último. */
const SEVERITY = { heavy: 0, moderate: 1, free: 2, unknown: 3 }
export const compareBySeverity = (a, b) => SEVERITY[a.level] - SEVERITY[b.level]
