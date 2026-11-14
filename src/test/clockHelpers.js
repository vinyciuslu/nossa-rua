import { clock } from '../services/clock.js'

const HOUR = 3_600_000
const isWeekend = (ms) => [0, 6].includes(new Date(ms - 3 * HOUR).getUTCDay())

/**
 * Leva o relógio de demonstração para as `hour` h (hora de São Paulo) do próximo
 * dia útil. O trânsito simulado depende da hora do dia, e os testes precisam de
 * um horário conhecido (pico, meio-dia, madrugada) para não variar com a hora real.
 */
export function goToLocalHour(hour) {
  clock.reset()
  const today = new Date()
  let target = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    hour + 3,
  )
  while (target <= Date.now() || isWeekend(target)) target += 24 * HOUR
  clock.advance(target - Date.now())
}
