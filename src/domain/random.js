/**
 * Gerador pseudoaleatório com semente (mulberry32).
 *
 * Com a mesma semente, a sequência é sempre a mesma. Isso torna dados simulados
 * reproduzíveis (e testáveis). Sem semente, usa Math.random.
 */
export function createRng(seed) {
  if (seed === undefined) return Math.random

  let state = hashSeed(seed)
  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Aceita número ou texto como semente. */
function hashSeed(seed) {
  if (typeof seed === 'number') return seed | 0
  let h = 2166136261
  for (const char of String(seed)) {
    h = Math.imul(h ^ char.charCodeAt(0), 16777619)
  }
  return h | 0
}
