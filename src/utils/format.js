const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

/** Data e hora no fuso de São Paulo, ex.: "11/11/2026, 20:53". */
export function formatDateTime(iso) {
  return dateTime.format(new Date(iso))
}
