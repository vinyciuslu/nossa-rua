/** Filtros da fila de ocorrências. `items` já têm `priority` (ver priority.js). */

export const QUEUE_STATES = [
  { id: 'open', label: 'Abertas' },
  { id: 'closed', label: 'Encerradas' },
  { id: 'all', label: 'Todas' },
]

export function filterAdminReports(
  items,
  { state = 'open', level = 'all', cityId = 'all', category = 'all' } = {},
) {
  return items.filter((item) => {
    if (state === 'open' && item.priority.closed) return false
    if (state === 'closed' && !item.priority.closed) return false
    if (level !== 'all' && item.priority.level !== level) return false
    if (cityId !== 'all' && item.neighborhoodId.split('/')[0] !== cityId) return false
    if (category !== 'all' && item.category !== category) return false
    return true
  })
}
