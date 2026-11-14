const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

/** Data e hora no fuso de São Paulo, ex.: "11/11/2026, 20:53". */
export function formatDateTime(iso) {
  return dateTime.format(new Date(iso))
}

const eventDay = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
})
const eventHour = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })

/**
 * Quando um evento acontece, ex.: "sáb., 14/11 · 10:00 às 12:00".
 * Se termina em outro dia, mostra as duas datas.
 */
export function formatEventWhen(startsAt, endsAt) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const first = `${eventDay.format(start)} · ${eventHour.format(start)}`
  if (dayKey.format(start) === dayKey.format(end)) {
    return `${first} às ${eventHour.format(end)}`
  }
  return `${first} até ${eventDay.format(end)} · ${eventHour.format(end)}`
}

const clockTime = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

/** Só a hora, no fuso de São Paulo, ex.: "14:32". */
export function formatClock(iso) {
  return clockTime.format(new Date(iso))
}
