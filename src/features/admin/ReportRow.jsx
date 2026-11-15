import { Link } from 'react-router-dom'
import { Clock, ThumbsUp, TriangleAlert } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { StatusBadge } from '../../components/ui/StatusBadge.jsx'
import { formatPlace } from '../../domain/places.js'
import { formatDuration } from '../../domain/relativeTime.js'
import { UrgencyBadge } from './UrgencyBadge.jsx'

/** Uma ocorrência na fila: pontuação, título (link para o detalhe), selos e números principais. */
export function ReportRow({ report, headingLevel: Heading = 'h2' }) {
  const { priority } = report
  return (
    <article
      aria-labelledby={`row-${report.id}`}
      className="hairline grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-card border-line bg-surface p-4"
    >
      <div
        className="flex size-14 flex-col items-center justify-center rounded-control bg-primary-soft text-primary-ink"
        title="Pontuação de prioridade"
      >
        <span className="font-display text-xl leading-none font-bold">
          {priority.score}
        </span>
        <span className="text-[0.6875rem] font-bold uppercase">pontos</span>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Heading
          id={`row-${report.id}`}
          className="font-display text-base font-bold text-ink"
        >
          <Link
            to={`/admin/ocorrencias/${report.id}`}
            className="underline-offset-2 hover:underline"
          >
            {report.title}
          </Link>
        </Heading>
        <p className="text-sm text-ink-muted">
          {formatPlace(report.neighborhoodId)} · {report.categoryLabel}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <UrgencyBadge level={priority.level} />
          <StatusBadge status={report.status} />
          {priority.overdue && (
            <Badge tone="danger" icon={TriangleAlert}>
              Prazo de referência excedido
            </Badge>
          )}
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
          <span className="flex items-center gap-1.5">
            <Icon icon={Clock} size="sm" />
            {priority.closed ? 'Levou' : 'Espera:'} {formatDuration(priority.waitedHours)}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon icon={ThumbsUp} size="sm" />
            {report.supports} {report.supports === 1 ? 'apoio' : 'apoios'}
          </span>
        </p>
      </div>
    </article>
  )
}
