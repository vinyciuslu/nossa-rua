/**
 * Geometria mínima para trechos e linhas: distância, posição ao longo de um
 * percurso e limites para enquadrar o mapa. Pontos são [latitude, longitude].
 */

const EARTH_RADIUS_M = 6_371_000
const toRad = (deg) => (deg * Math.PI) / 180

/** Distância em metros entre dois pontos (fórmula de haversine). */
export function distanceMeters(a, b) {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Prepara um percurso: guarda a distância acumulada em cada vértice. */
export function buildPath(points) {
  const cumulative = [0]
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + distanceMeters(points[i - 1], points[i]))
  }
  return { points, cumulative, total: cumulative[cumulative.length - 1] }
}

/** Que fração (0 a 1) do percurso já foi andada ao chegar no vértice `index`. */
export function fractionOfVertex(path, index) {
  return path.total === 0 ? 0 : path.cumulative[index] / path.total
}

/** Ponto na fração `fraction` (0 a 1) do percurso, interpolando dentro do trecho. */
export function pointAtFraction(path, fraction) {
  const { points, cumulative, total } = path
  const f = Math.min(1, Math.max(0, fraction))
  const target = f * total
  let i = 1
  while (i < points.length - 1 && cumulative[i] < target) i++
  const segment = cumulative[i] - cumulative[i - 1]
  const t = segment === 0 ? 0 : (target - cumulative[i - 1]) / segment
  const [aLat, aLng] = points[i - 1]
  const [bLat, bLng] = points[i]
  return [aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t]
}

/** Retângulo [[sul, oeste], [norte, leste]] que contém todos os pontos. */
export function boundsOf(points) {
  const lats = points.map((p) => p[0])
  const lngs = points.map((p) => p[1])
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}
