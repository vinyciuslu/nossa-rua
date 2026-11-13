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
