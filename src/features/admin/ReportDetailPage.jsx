import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PostImage } from '../../components/post/PostImage.jsx'
import { CategoryIllustration } from '../../components/illustrations/Illustrations.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { StatusBadge } from '../../components/ui/StatusBadge.jsx'
import { StatusTimeline } from '../../components/ui/StatusTimeline.jsx'
import { ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { APP_NAME } from '../../config/appConfig.js'
import { formatPlace } from '../../domain/places.js'
import { getCategory } from '../../domain/reportCategories.js'
import { formatDateTime } from '../../utils/format.js'
import { PriorityBreakdown } from './PriorityBreakdown.jsx'
import { StatusUpdateForm } from './StatusUpdateForm.jsx'
import { UrgencyBadge } from './UrgencyBadge.jsx'
import { useAdminReport } from './useAdminReports.js'

/** Uma ocorrência: o relato, a conta da prioridade, o histórico e a atualização de status. */
export function ReportDetailPage() {
  const { id } = useParams()
  const query = useAdminReport(id)
  const report = query.data
  const [updatedTo, setUpdatedTo] = useState(null)

  useEffect(() => {
    document.title = `${report?.title ?? 'Ocorrência'} · Painel · ${APP_NAME}`
  }, [report?.title])

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/admin/ocorrencias"
        className="inline-flex min-h-(--tap-min) w-fit items-center gap-1.5 rounded-control pr-2 font-bold text-primary"
      >
        <Icon icon={ArrowLeft} />
        Voltar à fila
      </Link>

      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Carregando…</span>
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {query.isError && (
        <ErrorState title="Ocorrência não encontrada" message={query.error.message} />
      )}

      {report && (
        <>
          <header className="flex flex-col gap-3">
            <h1 className="font-display text-2xl font-bold">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <UrgencyBadge level={report.priority.level} />
              <StatusBadge status={report.status} />
            </div>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="font-bold">Local:</dt>
                <dd className="text-ink-muted">{formatPlace(report.neighborhoodId)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold">Categoria:</dt>
                <dd className="text-ink-muted">{report.categoryLabel}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold">Publicado por:</dt>
                <dd className="text-ink-muted">{report.authorLabel}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold">Em:</dt>
                <dd className="text-ink-muted">
                  <time dateTime={report.createdAt}>
                    {formatDateTime(report.createdAt)}
                  </time>
                </dd>
              </div>
            </dl>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="relative aspect-video overflow-hidden rounded-card bg-surface-alt">
                {report.imageId ? (
                  <PostImage post={report} />
                ) : (
                  <CategoryIllustration
                    category={getCategory(report.category).illustration}
                  />
                )}
              </div>
              <p className="max-w-prose text-ink">{report.description}</p>
              <section aria-labelledby="history-title" className="flex flex-col gap-3">
                <h2 id="history-title" className="font-display text-lg font-bold">
                  Histórico do relato
                </h2>
                <StatusTimeline events={report.events} />
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <div role="status">
                {updatedTo && (
                  <Notice tone="info" title="Atualização registrada">
                    <p>
                      O relato agora está em “{updatedTo}”. O morador já vê a mudança no
                      histórico.
                    </p>
                  </Notice>
                )}
              </div>
              <StatusUpdateForm
                key={report.status}
                report={report}
                onUpdated={setUpdatedTo}
              />
              <PriorityBreakdown priority={report.priority} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
