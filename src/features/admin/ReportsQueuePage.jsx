import { useEffect, useState } from 'react'
import { Chip } from '../../components/ui/Chip.jsx'
import { SelectField } from '../../components/ui/FormFields.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { APP_NAME } from '../../config/appConfig.js'
import { QUEUE_STATES, filterAdminReports } from '../../domain/adminQueue.js'
import { CITIES } from '../../domain/places.js'
import { URGENCY_LEVELS } from '../../domain/priority.js'
import { REPORT_CATEGORIES } from '../../domain/reportCategories.js'
import { ReportRow } from './ReportRow.jsx'
import { useAdminReports } from './useAdminReports.js'

const PAGE_SIZE = 25

/** Fila de ocorrências, da mais prioritária para a menos, com filtros. */
export function ReportsQueuePage() {
  const query = useAdminReports()
  const [filters, setFilters] = useState({
    state: 'open',
    level: 'all',
    cityId: 'all',
    category: 'all',
  })
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    document.title = `Ocorrências · Painel · ${APP_NAME}`
  }, [])

  function change(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
    setVisible(PAGE_SIZE) // filtro novo volta ao começo da lista
  }

  const items = query.data ? filterAdminReports(query.data, filters) : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Ocorrências</h1>
        <p className="mt-1 max-w-prose text-ink-muted">
          Ordenadas por prioridade: primeiro o nível de urgência; dentro dele, a espera e
          o apoio da comunidade.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div role="group" aria-label="Situação" className="flex flex-wrap gap-2">
          {QUEUE_STATES.map((s) => (
            <Chip
              key={s.id}
              selected={filters.state === s.id}
              onClick={() => change('state', s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Urgência"
            value={filters.level}
            onChange={(e) => change('level', e.target.value)}
          >
            <option value="all">Todas</option>
            {Object.entries(URGENCY_LEVELS).map(([id, level]) => (
              <option key={id} value={id}>
                {level.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Município"
            value={filters.cityId}
            onChange={(e) => change('cityId', e.target.value)}
          >
            <option value="all">Todos</option>
            {CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Categoria"
            value={filters.category}
            onChange={(e) => change('category', e.target.value)}
          >
            <option value="all">Todas</option>
            {REPORT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Carregando a fila…</span>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}
      {query.isError && (
        <ErrorState
          title="Não foi possível carregar a fila"
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && items.length === 0 && (
        <EmptyState
          title="Nenhuma ocorrência com estes filtros"
          description="Tente outra situação, urgência, município ou categoria."
        />
      )}

      {items.length > 0 && (
        <>
          <p aria-live="polite" className="text-sm text-ink-muted">
            Mostrando {Math.min(visible, items.length)} de {items.length}{' '}
            {items.length === 1 ? 'ocorrência' : 'ocorrências'}.
          </p>
          <ul className="flex flex-col gap-3">
            {items.slice(0, visible).map((report) => (
              <li key={report.id}>
                <ReportRow report={report} />
              </li>
            ))}
          </ul>
          {items.length > visible && (
            <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              Mostrar mais ({items.length - visible} restantes)
            </Button>
          )}
        </>
      )}
    </div>
  )
}
