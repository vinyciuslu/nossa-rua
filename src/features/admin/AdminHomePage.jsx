import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { APP_NAME } from '../../config/appConfig.js'
import { summarizeQueue } from '../../domain/priority.js'
import { formatDuration } from '../../domain/relativeTime.js'
import { ReportRow } from './ReportRow.jsx'
import { useAdminReports } from './useAdminReports.js'

function Stat({ label, value, hint }) {
  return (
    <div className="hairline flex flex-col gap-1 rounded-card border-line bg-surface p-4">
      <dt className="text-sm font-bold text-ink-muted">{label}</dt>
      <dd className="font-display text-3xl font-bold text-ink">{value}</dd>
      {hint && <dd className="text-sm text-ink-muted">{hint}</dd>}
    </div>
  )
}

/** Visão geral: números da fila e as ocorrências que pedem atenção primeiro. */
export function AdminHomePage() {
  const query = useAdminReports()

  useEffect(() => {
    document.title = `Painel · ${APP_NAME}`
  }, [])

  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar o painel"
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    )
  }

  const reports = query.data
  const summary = reports && summarizeQueue(reports)
  const top = reports?.filter((r) => !r.priority.closed).slice(0, 5) ?? []

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>
        <p className="mt-1 max-w-prose text-ink-muted">
          Ambiente de demonstração: as ações feitas aqui aparecem para os moradores deste
          navegador, mas não acionam nenhum órgão público.
        </p>
      </div>

      {!summary ? (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <span className="sr-only">Carregando…</span>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <dl
          aria-label="Resumo da fila"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Stat label="Ocorrências abertas" value={summary.open} />
          <Stat
            label="Com prazo excedido"
            value={summary.overdue}
            hint="Passaram do prazo de referência do nível"
          />
          <Stat
            label="Por urgência"
            value={`${summary.byLevel.high} · ${summary.byLevel.medium} · ${summary.byLevel.low}`}
            hint="alta · média · baixa"
          />
          <Stat
            label="Espera média (abertas)"
            value={formatDuration(summary.averageWaitHours)}
            hint={`${summary.closed} já encerradas`}
          />
        </dl>
      )}

      <section aria-labelledby="top-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="top-title" className="font-display text-lg font-bold">
            Primeiras da fila
          </h2>
          <Link
            to="/admin/ocorrencias"
            className="inline-flex min-h-(--tap-min) items-center font-bold text-primary underline"
          >
            Ver a fila completa
          </Link>
        </div>
        <ul className="flex flex-col gap-3">
          {top.map((report) => (
            <li key={report.id}>
              <ReportRow report={report} headingLevel="h3" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
