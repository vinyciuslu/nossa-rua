import { Gauge } from 'lucide-react'
import { Icon } from '../../components/ui/Icon.jsx'
import { TrafficBadge } from '../../components/ui/TrafficBadge.jsx'
import { DEFAULT_THRESHOLDS, compareBySeverity } from '../../domain/traffic.js'
import { formatClock } from '../../utils/format.js'

function summarize(segments) {
  const count = (level) => segments.filter((s) => s.reading.level === level).length
  const parts = [
    [count('heavy'), 'com congestionamento intenso'],
    [count('moderate'), 'com trânsito moderado'],
    [count('free'), 'livres'],
    [count('unknown'), 'sem leitura'],
  ]
    .filter(([n]) => n > 0)
    .map(([n, text]) => `${n} ${n === 1 ? 'trecho' : 'trechos'} ${text}`)
  return parts.join(', ')
}

/** Lista de trechos, do mais grave ao mais leve. É a versão completa do que o mapa mostra. */
export function TrafficPanel({
  segments,
  thresholds = DEFAULT_THRESHOLDS,
  selectedId,
  onSelect,
}) {
  const sorted = segments
    .map((segment) => ({ ...segment, level: segment.reading.level }))
    .sort(compareBySeverity)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink" aria-live="polite">
        {summarize(segments)}.
      </p>

      <h2 className="sr-only">Trechos monitorados</h2>
      <ul className="flex flex-col gap-3">
        {sorted.map((segment) => {
          const { reading } = segment
          const selected = selectedId === segment.id
          return (
            <li key={segment.id}>
              <article
                aria-labelledby={`seg-${segment.id}`}
                className={`rounded-card bg-surface p-4 ${
                  selected ? 'border-2 border-primary' : 'hairline border-line'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3
                    id={`seg-${segment.id}`}
                    className="font-display text-base font-bold text-ink"
                  >
                    {segment.name}
                  </h3>
                  <TrafficBadge level={segment.level} />
                </div>
                <p className="mt-2 flex items-center gap-2 text-ink">
                  <Icon icon={Gauge} />
                  {reading.status === 'ok'
                    ? `${reading.speedKmh} km/h (${reading.percent}% dos ${segment.freeFlowKmh} km/h normais)`
                    : 'O sensor está sem sinal; não dá para estimar a velocidade agora.'}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {reading.status === 'ok' ? 'Leitura' : 'Último sinal'} simulada às{' '}
                  {formatClock(reading.updatedAt)}
                </p>
                {onSelect && (
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelect(selected ? null : segment.id)}
                    className="mt-2 min-h-(--tap-min) rounded-control px-1 font-bold text-primary underline"
                  >
                    {selected ? 'Tirar destaque do mapa' : 'Destacar no mapa'}
                  </button>
                )}
              </article>
            </li>
          )
        })}
      </ul>

      <section
        aria-labelledby="traffic-legend"
        className="rounded-card bg-surface-alt p-4"
      >
        <h3 id="traffic-legend" className="font-display font-bold text-ink">
          Como classificamos
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          Comparamos a velocidade lida com a velocidade normal do trecho.
        </p>
        <ul className="mt-2 flex flex-col gap-2 text-sm text-ink">
          <li className="flex flex-wrap items-center gap-2">
            <TrafficBadge level="free" /> a partir de {thresholds.freeFrom}%
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <TrafficBadge level="moderate" /> de {thresholds.heavyBelow}% a{' '}
            {thresholds.freeFrom - 1}%
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <TrafficBadge level="heavy" /> abaixo de {thresholds.heavyBelow}%
          </li>
        </ul>
      </section>
    </div>
  )
}
