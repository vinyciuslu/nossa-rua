import { MOBILITY_CITIES } from '../data/seedMobility.js'
import {
  arrivalsAt,
  busesOf,
  isInService,
  lineProgress,
  withStopFractions,
} from '../domain/buses.js'
import { boundsOf, buildPath } from '../domain/geo.js'
import {
  DEFAULT_THRESHOLDS,
  classifyTraffic,
  sensorReading,
  trafficRatio,
} from '../domain/traffic.js'
import { clock } from './clock.js'
import { wait } from './latency.js'
import { ServiceError } from './ServiceError.js'

/**
 * Mobilidade: trânsito (sensores simulados) e ônibus (posições e previsões
 * simuladas). Tudo é calculado, a cada consulta, para o instante do relógio do app:
 * um backend de verdade devolveria o mesmo formato a partir de sensores e GPS.
 */

// Os percursos não mudam; prepará-los uma vez evita refazer as distâncias a cada leitura.
const PATHS = new Map(
  MOBILITY_CITIES.flatMap((city) => city.lines.map((l) => [l.id, buildPath(l.path)])),
)

export async function listMobilityCities() {
  await wait()
  return MOBILITY_CITIES.map(({ id, name }) => ({ id, name }))
}

/**
 * Situação de um município agora.
 * @param {string} cityId
 * @param {{ thresholds?: { freeFrom: number, heavyBelow: number } }} [options]
 */
export async function getMobilitySnapshot(
  cityId,
  { thresholds = DEFAULT_THRESHOLDS } = {},
) {
  await wait()
  const city = MOBILITY_CITIES.find((c) => c.id === cityId)
  if (!city)
    throw new ServiceError('not_found', 'Não temos dados de mobilidade deste município.')

  const now = clock.now()
  const nowMs = now.getTime()
  const sensorsById = new Map(city.segments.map((s) => [s.id, s.sensor]))

  const segments = city.segments.map((segment) => ({
    id: segment.id,
    name: segment.name,
    path: segment.path,
    freeFlowKmh: segment.sensor.freeFlowKmh,
    reading: sensorReading(segment.sensor, now, thresholds),
  }))

  const inService = isInService(now)
  const lines = city.lines.map((rawLine) => {
    const path = PATHS.get(rawLine.id)
    const line = withStopFractions(rawLine, path)
    // trânsito médio nos trechos da linha (o ônibus anda pelo trânsito real, mesmo se o sensor estiver sem sinal)
    const ratioAt = (ms) => {
      const sensors = line.segmentIds.map((id) => sensorsById.get(id))
      return sensors.reduce((sum, s) => sum + trafficRatio(s, ms), 0) / sensors.length
    }
    const currentRatio = ratioAt(nowMs)
    const buses = inService ? busesOf(line, path, lineProgress(line, ratioAt, now)) : []

    return {
      id: line.id,
      code: line.code,
      name: line.name,
      path: line.path,
      running: inService,
      trafficLevel: classifyTraffic(Math.round(currentRatio * 100), thresholds),
      buses,
      stops: line.stops.map((stop) => ({
        id: stop.id,
        name: stop.name,
        position: line.path[stop.vertexIndex],
        arrivals: inService ? arrivalsAt(line, stop, buses, currentRatio) : [],
      })),
    }
  })

  return {
    cityId: city.id,
    cityName: city.name,
    center: city.center,
    zoom: city.zoom,
    bounds: boundsOf([
      ...segments.flatMap((s) => s.path),
      ...lines.flatMap((l) => l.path),
    ]),
    at: now.toISOString(),
    segments,
    lines,
  }
}
