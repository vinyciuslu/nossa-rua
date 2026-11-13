import { getNeighborhood } from './places.js'

/**
 * Limites das publicações comerciais (anúncios), para que não dominem o feed.
 * Publicidade é sempre identificada como tal e tem dois limites:
 *  - de frequência: no máximo MAX_PER_WEEK anúncios por conta a cada 7 dias;
 *  - geográfico: só em bairros do mesmo município do comércio.
 */
export const MAX_COMMERCIAL_PER_WEEK = 2
const WEEK = 7 * 24 * 3_600_000

/**
 * `account`: conta CNPJ. `existing`: publicações já criadas por ela.
 * Devolve `{ ok: true }` ou `{ ok: false, error }` com mensagem pronta.
 */
export function checkCommercialLimits({ account, neighborhoodId, existing, now }) {
  const target = getNeighborhood(neighborhoodId)
  const home = getNeighborhood(account?.neighborhoodId)
  if (!target) return { ok: false, error: 'Escolha um bairro da lista.' }
  if (home && target.cityId !== home.cityId) {
    return {
      ok: false,
      error: `Seu comércio fica em ${home.cityName}. Anúncios só podem aparecer em bairros do mesmo município.`,
    }
  }
  const recent = existing.filter(
    (p) =>
      p.type === 'commercial' && now.getTime() - new Date(p.createdAt).getTime() < WEEK,
  )
  if (recent.length >= MAX_COMMERCIAL_PER_WEEK) {
    const oldest = Math.min(...recent.map((p) => new Date(p.createdAt).getTime()))
    const days = Math.max(
      1,
      Math.ceil((oldest + WEEK - now.getTime()) / (24 * 3_600_000)),
    )
    return {
      ok: false,
      error: `Você já publicou ${MAX_COMMERCIAL_PER_WEEK} anúncios nesta semana. Novo anúncio em ${days} ${days === 1 ? 'dia' : 'dias'}.`,
    }
  }
  return { ok: true }
}
