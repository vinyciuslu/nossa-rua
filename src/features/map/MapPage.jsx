import { Suspense, lazy, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Page } from '../../components/layout/Page.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { SimulatedBadge } from '../../components/ui/SimulatedBadge.jsx'
import { ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { useClock } from '../../context/ClockContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { MOBILITY_CITIES } from '../../data/seedMobility.js'
import { getMobilitySnapshot } from '../../services/mobilityService.js'
import { formatClock } from '../../utils/format.js'
import { BusPanel } from './BusPanel.jsx'
import { MapLegend } from './MapLegend.jsx'
import { TrafficPanel } from './TrafficPanel.jsx'

// O Leaflet só é baixado quando a aba Mapa é aberta: o resto do app não paga por ele.
const MapView = lazy(() => import('./MapView.jsx'))

const MODES = [
  { id: 'traffic', label: 'Trânsito' },
  { id: 'bus', label: 'Ônibus' },
]
const REFRESH_MS = 15_000

/** Município da conta, se tivermos dados dele; senão, São Paulo. */
function defaultCityId(account) {
  const home = account?.neighborhoodId?.split('/')[0]
  return MOBILITY_CITIES.some((c) => c.id === home) ? home : 'sao-paulo'
}

/**
 * Mapa: trânsito (sensores simulados) e ônibus (posições simuladas).
 * As listas são a versão completa e acessível; o mapa (quando carregado) é um
 * complemento visual dos mesmos dados.
 */
export function MapPage() {
  const { account } = useSession()
  const { offsetMs } = useClock()
  const [cityId, setCityId] = useState(() => defaultCityId(account))
  const [mode, setMode] = useState('traffic')
  const [selectedLineId, setSelectedLineId] = useState(null)
  const [selectedSegmentId, setSelectedSegmentId] = useState(null)
  const [tilesFailed, setTilesFailed] = useState(false)

  const query = useQuery({
    queryKey: ['mobility', cityId, { offsetMs }],
    queryFn: () => getMobilitySnapshot(cityId),
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
  })
  const snapshot = query.data

  function changeCity(id) {
    setCityId(id)
    setSelectedLineId(null)
    setSelectedSegmentId(null)
  }

  return (
    <Page
      title="Mapa"
      description="Trânsito e ônibus do seu município, com dados simulados."
    >
      <Notice tone="info">
        <p>
          <strong>Dados simulados e esquemáticos.</strong> Os trechos ligam bairros em
          linha reta e não seguem ruas reais: não use para decidir o seu trajeto.
        </p>
      </Notice>

      <div role="group" aria-label="Município" className="flex flex-wrap gap-2">
        {MOBILITY_CITIES.map((city) => (
          <Chip
            key={city.id}
            selected={cityId === city.id}
            onClick={() => changeCity(city.id)}
          >
            {city.name}
          </Chip>
        ))}
      </div>

      <div role="group" aria-label="O que ver" className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Chip key={m.id} selected={mode === m.id} onClick={() => setMode(m.id)}>
            {m.label}
          </Chip>
        ))}
      </div>

      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Carregando o mapa…</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}
      {query.isError && !snapshot && (
        <ErrorState
          title="Não foi possível carregar a mobilidade"
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      )}

      {snapshot && (
        <>
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <MapView
              snapshot={snapshot}
              mode={mode}
              selectedLineId={selectedLineId}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={setSelectedSegmentId}
              onTilesFailed={() => setTilesFailed(true)}
            />
          </Suspense>
          <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <SimulatedBadge />
            Atualizado às {formatClock(snapshot.at)} · {snapshot.cityName}
          </p>
          {tilesFailed && (
            <Notice tone="warn" title="O mapa-base não carregou">
              <p>
                Ele depende de internet e do OpenStreetMap. Os trechos e as linhas
                continuam desenhados e as listas abaixo têm todas as informações.
              </p>
            </Notice>
          )}
          {mode === 'traffic' ? (
            <MapLegend />
          ) : (
            <p className="text-sm text-ink-muted">
              Quadrados numerados são ônibus; ao abrir uma linha, os círculos são os
              pontos de parada.
            </p>
          )}

          {mode === 'traffic' ? (
            <TrafficPanel
              segments={snapshot.segments}
              thresholds={snapshot.thresholds}
              selectedId={selectedSegmentId}
              onSelect={setSelectedSegmentId}
            />
          ) : (
            <BusPanel
              lines={snapshot.lines}
              selectedId={selectedLineId}
              onSelect={setSelectedLineId}
            />
          )}
        </>
      )}
    </Page>
  )
}
