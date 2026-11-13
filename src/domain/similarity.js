import { isClosedStatus } from './reportStatus.js'

/**
 * Detecção de relatos parecidos, para evitar duplicatas: antes de publicar, a
 * pessoa vê relatos abertos da mesma categoria, no mesmo bairro, e pode apoiar
 * um deles em vez de criar outro.
 *
 * Regra (simples e explicável, sem IA): um relato é "parecido" quando
 *   1. é da mesma categoria e do mesmo bairro;
 *   2. ainda está aberto (não resolvido nem não procedente);
 *   3. foi publicado nos últimos 30 dias;
 *   4. pelo menos 2 palavras do rascunho aparecem nele, e elas somam pelo menos
 *      metade das palavras relevantes do rascunho.
 */

const STOPWORDS = new Set(
  (
    'a o as os um uma uns umas de da do das dos em na no nas nos por para com sem sob ' +
    'sobre entre ate que se ao aos mais muito muita muitos muitas ja nao sim tem ter ha ' +
    'esta estao esse essa isso aqui ali la como mas ou e foi sao ser ficou ficam fica ' +
    'rua bairro perto proximo'
  ).split(' '),
)

const DAY = 24 * 3_600_000
export const SIMILARITY_WINDOW_DAYS = 30

const strip = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Palavras relevantes: sem acento, sem palavras comuns, com 3+ letras. */
export function tokenize(text) {
  return new Set(
    strip(text)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3 && !STOPWORDS.has(word)),
  )
}

export function similarityScore(draftText, candidateText) {
  const draft = tokenize(draftText)
  if (draft.size === 0) return { shared: 0, score: 0 }
  const candidate = tokenize(candidateText)
  let shared = 0
  for (const word of draft) if (candidate.has(word)) shared++
  return { shared, score: shared / draft.size }
}

/**
 * `draft`: { neighborhoodId, category, title, description }.
 * `candidates`: relatos já apresentados (com `status`), de qualquer bairro.
 * Devolve até `limit` relatos, os mais parecidos primeiro.
 */
export function findSimilarReports(draft, candidates, now, limit = 3) {
  const draftText = `${draft.title ?? ''} ${draft.description ?? ''}`
  return candidates
    .filter(
      (c) =>
        c.type === 'report' &&
        c.neighborhoodId === draft.neighborhoodId &&
        c.category === draft.category &&
        !isClosedStatus(c.status) &&
        now.getTime() - new Date(c.createdAt).getTime() <= SIMILARITY_WINDOW_DAYS * DAY,
    )
    .map((c) => ({
      post: c,
      ...similarityScore(draftText, `${c.title} ${c.description}`),
    }))
    .filter((m) => m.shared >= 2 && m.score >= 0.5)
    .sort((a, b) => b.score - a.score || b.shared - a.shared)
    .slice(0, limit)
    .map((m) => m.post)
}
