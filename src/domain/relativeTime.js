const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

/**
 * Tempo decorrido em português: "agora", "há 5 min", "há 2 h", "ontem", "há 3 dias".
 * Depois de uma semana, mostra a data. `now` é passado de fora para a função
 * continuar pura (e para o relógio de demonstração funcionar).
 */
export function formatRelative(iso, now) {
  const diff = now.getTime() - new Date(iso).getTime()
  if (diff < MINUTE) return 'agora'
  if (diff < HOUR) return `há ${Math.floor(diff / MINUTE)} min`
  if (diff < DAY) return `há ${Math.floor(diff / HOUR)} h`
  if (diff < 2 * DAY) return 'ontem'
  if (diff < 7 * DAY) return `há ${Math.floor(diff / DAY)} dias`
  return shortDate.format(new Date(iso))
}

export const HOURS = HOUR
export const DAYS = DAY

/** Duração em horas como texto curto: "3 h", "2 dias", "1 dia e 4 h". Para tempos de espera. */
export function formatDuration(hours) {
  const total = Math.max(0, Math.round(hours))
  if (total < 1) return 'menos de 1 h'
  if (total < 48) return `${total} h`
  const days = Math.floor(total / 24)
  const rest = total % 24
  const dayText = `${days} ${days === 1 ? 'dia' : 'dias'}`
  return rest === 0 || days >= 7 ? dayText : `${dayText} e ${rest} h`
}
