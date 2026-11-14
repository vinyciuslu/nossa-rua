import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './map.css'
import { boundsOf } from '../../domain/geo.js'
import { trafficLineStyle } from './mapStyles.js'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">Colaboradores do OpenStreetMap</a>'

const prefers = (query) =>
  typeof window.matchMedia === 'function' && window.matchMedia(query).matches

/**
 * Mapa com Leaflet e OpenStreetMap. É um complemento visual: as listas da tela
 * têm as mesmas informações. Por isso os marcadores não recebem foco do teclado
 * (seriam dezenas de paradas de Tab) e só os trechos reagem a toque/clique.
 *
 * O mapa é criado uma vez; os dados (que chegam a cada 15 s) só redesenham as
 * camadas, sem mexer no zoom e no deslocamento que a pessoa escolheu.
 */
export default function MapView({
  snapshot,
  mode,
  selectedLineId,
  selectedSegmentId,
  onSelectSegment,
  onTilesFailed,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const lastCityRef = useRef(null)
  const lastLineRef = useRef(null)
  const callbacks = useRef({ onSelectSegment, onTilesFailed })
  const coarsePointer = prefers('(pointer: coarse)')

  // Os eventos do Leaflet vivem mais que uma renderização: guardam sempre a versão atual.
  useEffect(() => {
    callbacks.current = { onSelectSegment, onTilesFailed }
  })

  useEffect(() => {
    const reduceMotion = prefers('(prefers-reduced-motion: reduce)')
    const map = L.map(containerRef.current, {
      attributionControl: false,
      // Em tela de toque, um dedo rola a página; dois dedos movem o mapa.
      dragging: !coarsePointer,
      zoomAnimation: !reduceMotion,
      fadeAnimation: !reduceMotion,
      markerZoomAnimation: !reduceMotion,
    })
    L.control.attribution({ prefix: false }).addTo(map)

    let failed = false
    L.tileLayer(TILES, { maxZoom: 18, attribution: ATTRIBUTION })
      .on('tileerror', () => {
        if (failed) return
        failed = true
        callbacks.current.onTilesFailed?.()
      })
      .addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    // o contêiner pode ganhar tamanho só depois do primeiro desenho da tela
    const frame = requestAnimationFrame(() => map.invalidateSize())

    return () => {
      cancelAnimationFrame(frame)
      map.remove()
      mapRef.current = null
      layerRef.current = null
      lastCityRef.current = null
      lastLineRef.current = null
    }
  }, [coarsePointer])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    // Enquadra só quando o município ou a linha escolhida mudam, não a cada
    // atualização dos dados (senão o mapa "pularia" de volta enquanto a pessoa o move).
    const framingChanged =
      lastCityRef.current !== snapshot.cityId || lastLineRef.current !== selectedLineId
    if (framingChanged) {
      lastCityRef.current = snapshot.cityId
      lastLineRef.current = selectedLineId
      const line = snapshot.lines.find((l) => l.id === selectedLineId)
      map.fitBounds(line ? boundsOf(line.path) : snapshot.bounds, { padding: [28, 28] })
    }

    layer.clearLayers()

    if (mode === 'traffic') {
      for (const segment of snapshot.segments) {
        const style = trafficLineStyle(segment.reading.level)
        if (segment.id === selectedSegmentId) {
          L.polyline(segment.path, {
            className: 'nr-halo',
            weight: style.weight + 10,
            interactive: false,
          }).addTo(layer)
        }
        L.polyline(segment.path, style)
          .bindTooltip(segment.name, { sticky: true })
          .on('click', () => callbacks.current.onSelectSegment?.(segment.id))
          .addTo(layer)
      }
      return
    }

    const lines = selectedLineId
      ? snapshot.lines.filter((l) => l.id === selectedLineId)
      : snapshot.lines
    for (const line of snapshot.lines) {
      const selected = line.id === selectedLineId
      L.polyline(line.path, {
        className: selected ? 'nr-route-selected' : 'nr-route',
        weight: selected ? 6 : 3,
        interactive: false,
      }).addTo(layer)
    }
    if (selectedLineId) {
      for (const stop of lines.flatMap((l) => l.stops)) {
        L.circleMarker(stop.position, { className: 'nr-stop', radius: 7, weight: 3 })
          .bindTooltip(stop.name)
          .addTo(layer)
      }
    }
    for (const line of lines) {
      for (const bus of line.buses) {
        L.marker(bus.position, {
          keyboard: false,
          interactive: false,
          icon: L.divIcon({
            className: '',
            html: `<span class="nr-bus">${line.code}</span>`,
            iconSize: [40, 24],
            iconAnchor: [20, 12],
          }),
        }).addTo(layer)
      }
    }
  }, [snapshot, mode, selectedLineId, selectedSegmentId])

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={containerRef}
        role="region"
        aria-label="Mapa esquemático. As listas abaixo trazem as mesmas informações."
        className="nr-map h-72 overflow-hidden rounded-card hairline border-line"
      />
      {coarsePointer && (
        <p className="text-sm text-ink-muted">
          Use dois dedos para mover e aproximar o mapa.
        </p>
      )}
    </div>
  )
}
