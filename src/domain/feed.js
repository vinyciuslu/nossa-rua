export const POST_TYPES = ['report', 'notice', 'commercial']

export const FEED_FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'report', label: 'Relatos' },
  { id: 'notice', label: 'Avisos' },
  { id: 'commercial', label: 'Comércio' },
]

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

/**
 * Ordem do feed: avisos urgentes ainda recentes (últimas 24 h) ficam no topo, porque
 * risco imediato não pode ficar escondido atrás de publicações mais novas. O
 * restante vem do mais novo para o mais antigo.
 */
export function sortFeed(posts, now) {
  const isPinned = (p) =>
    p.type === 'notice' &&
    p.level === 'urgent' &&
    now.getTime() - new Date(p.createdAt).getTime() < 24 * 3_600_000
  return [
    ...posts.filter(isPinned).sort(byNewest),
    ...posts.filter((p) => !isPinned(p)).sort(byNewest),
  ]
}

export function filterFeed(posts, filterId) {
  return filterId === 'all' ? posts : posts.filter((p) => p.type === filterId)
}
