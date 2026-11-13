/**
 * Regras do feed estadual: alertas, notícias e eventos.
 *
 * Tudo é função pura: `now` vem de fora (relógio de demonstração) e nada aqui
 * conhece React, serviços ou armazenamento.
 *
 * Forma de um item (todos têm `kind`, `id`, `title`, `summary`, `publishedAt`,
 * `cityId` — null quando vale para o estado todo — e `source`):
 *  - alert: `level` (info | attention | urgent) e `expiresAt`
 *  - news:  `body` (parágrafos)
 *  - event: `startsAt`, `endsAt`, `venue`, `price` (null = gratuito)
 */

export const STATE_FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'alert', label: 'Alertas' },
  { id: 'news', label: 'Notícias' },
  { id: 'event', label: 'Eventos' },
  { id: 'saved', label: 'Salvos' },
]

export const REGION_SCOPES = [
  { id: 'state', label: 'Todo o estado' },
  { id: 'mine', label: 'Meus municípios' },
]

const LEVEL_RANK = { urgent: 0, attention: 1, info: 2 }
const KIND_RANK = { alert: 0, news: 1, event: 2 }

const time = (iso) => new Date(iso).getTime()
const newest = (a, b) => time(b.publishedAt) - time(a.publishedAt)

/** Alerta ainda vale? Depois de `expiresAt` ele fica "encerrado", mas não some. */
export function alertState(alert, now) {
  return now.getTime() < time(alert.expiresAt) ? 'active' : 'expired'
}

/** upcoming (ainda vai acontecer), ongoing (acontecendo agora) ou past. */
export function eventTiming(event, now) {
  const t = now.getTime()
  if (t < time(event.startsAt)) return 'upcoming'
  if (t < time(event.endsAt)) return 'ongoing'
  return 'past'
}

/** Um item "morto" é o que já encerrou: some da visão geral, mas aparece no filtro do tipo. */
export function isEnded(item, now) {
  if (item.kind === 'alert') return alertState(item, now) === 'expired'
  if (item.kind === 'event') return eventTiming(item, now) === 'past'
  return false
}

/**
 * Filtra por região, tipo e "salvos". Itens publicados no "futuro" (o relógio de
 * demonstração voltou) não aparecem, como no feed da comunidade.
 *
 * @param {object} options
 * @param {string} options.filter       id de STATE_FILTERS
 * @param {string[]|null} options.cityIds  null = estado todo; lista = só estes municípios
 *                                         (conteúdo estadual sempre entra)
 * @param {Set<string>} options.savedIds   ids de eventos salvos pela pessoa
 */
export function filterStateItems(items, { filter, cityIds = null, savedIds, now }) {
  // "Salvos" ignora a região: o que a pessoa salvou é dela, de qualquer município.
  const wanted = cityIds && filter !== 'saved' ? new Set(cityIds) : null
  return items
    .filter((item) => time(item.publishedAt) <= now.getTime())
    .filter((item) => !wanted || item.cityId === null || wanted.has(item.cityId))
    .filter((item) => {
      if (filter === 'all') return !isEnded(item, now)
      if (filter === 'saved') return savedIds.has(item.id)
      return item.kind === filter
    })
}

function compareWithinKind(a, b, now) {
  if (a.kind === 'alert') {
    const aEnded = isEnded(a, now)
    const bEnded = isEnded(b, now)
    if (aEnded !== bEnded) return aEnded ? 1 : -1
    return LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || newest(a, b)
  }
  if (a.kind === 'event') {
    const aEnded = isEnded(a, now)
    const bEnded = isEnded(b, now)
    if (aEnded !== bEnded) return aEnded ? 1 : -1
    // próximos: o que vem primeiro; já realizados: o mais recente primeiro
    return aEnded
      ? time(b.startsAt) - time(a.startsAt)
      : time(a.startsAt) - time(b.startsAt)
  }
  return newest(a, b)
}

/**
 * Ordem: alertas (ativos e mais graves primeiro), notícias (mais novas) e
 * eventos (os mais próximos primeiro; os que já passaram vão para o fim).
 */
export function sortStateItems(items, now) {
  return [...items].sort(
    (a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || compareWithinKind(a, b, now),
  )
}

/** Separa a lista (já filtrada e ordenada) em seções para a visão "Tudo". */
export function groupByKind(items) {
  return {
    alerts: items.filter((i) => i.kind === 'alert'),
    news: items.filter((i) => i.kind === 'news'),
    events: items.filter((i) => i.kind === 'event'),
  }
}

/** Municípios (ids) que a pessoa acompanha, sem repetição. */
export function cityIdsOf(followedPlaces) {
  return [...new Set(followedPlaces.map((f) => f.neighborhoodId.split('/')[0]))]
}
