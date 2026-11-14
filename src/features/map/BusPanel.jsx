import { Bus, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { TrafficBadge } from '../../components/ui/TrafficBadge.jsx'
import { SERVICE_HOURS, formatEta } from '../../domain/buses.js'

const formatHour = (h) => `${Math.floor(h)}h${h % 1 ? '30' : ''}`

function Arrivals({ arrivals }) {
  if (arrivals.length === 0) return <span>Sem previsão agora.</span>
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {arrivals.map((a, i) => (
        <li key={a.busId} className={i === 0 ? 'font-bold' : ''}>
          {formatEta(a.etaMs)}
          <span className="text-ink-muted"> (ônibus {a.busNumber})</span>
        </li>
      ))}
    </ul>
  )
}

/** Linhas de ônibus. Ao abrir uma linha, vê-se a previsão de chegada em cada ponto. */
export function BusPanel({ lines, selectedId, onSelect }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {lines.map((line) => {
          const open = selectedId === line.id
          const panelId = `line-panel-${line.id}`
          return (
            <li key={line.id}>
              <article
                className={`overflow-hidden rounded-card bg-surface ${
                  open ? 'border-2 border-primary' : 'hairline border-line'
                }`}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => onSelect(open ? null : line.id)}
                    className="flex min-h-(--tap-min) w-full items-start gap-3 p-4 text-left"
                  >
                    <Badge tone="solid" icon={Bus}>
                      {line.code}
                    </Badge>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="font-display font-bold text-ink">{line.name}</span>
                      <span className="text-sm text-ink-muted">
                        {line.running
                          ? `${line.buses.length} ônibus em operação`
                          : `Fora do horário (opera das ${formatHour(SERVICE_HOURS.from)} às ${formatHour(SERVICE_HOURS.to)})`}
                      </span>
                      {line.running && <TrafficBadge level={line.trafficLevel} />}
                    </span>
                    <Icon icon={open ? ChevronUp : ChevronDown} className="mt-1" />
                  </button>
                </h3>

                {open && (
                  <div id={panelId} className="border-t border-line px-4 pt-3 pb-4">
                    <p className="mb-2 text-sm text-ink-muted">
                      Linha circular. A previsão considera o trânsito de agora no
                      percurso.
                    </p>
                    <ol className="flex flex-col gap-3">
                      {line.stops.map((stop) => (
                        <li key={stop.id} className="flex flex-col gap-0.5">
                          <span className="font-bold text-ink">{stop.name}</span>
                          <Arrivals arrivals={stop.arrivals} />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
