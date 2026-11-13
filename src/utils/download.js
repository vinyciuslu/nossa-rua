/** Baixa um conteúdo como arquivo, sem passar por servidor. */
export function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadJson(data, filename) {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json')
}

/** Calendário (.ics). O charset importa: o título tem acentos. */
export function downloadIcs(content, filename) {
  downloadFile(content, filename, 'text/calendar;charset=utf-8')
}
