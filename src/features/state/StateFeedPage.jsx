import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { EmptyIllustration } from '../../components/illustrations/Illustrations.jsx'
import { Page } from '../../components/layout/Page.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { useClock } from '../../context/ClockContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import {
  REGION_SCOPES,
  STATE_FILTERS,
  cityIdsOf,
  filterStateItems,
  groupByKind,
  sortStateItems,
} from '../../domain/stateFeed.js'
import { listStateItems } from '../../services/stateService.js'
import { StateItem } from './StateItem.jsx'
import { useSaveEvent } from './useSaveEvent.js'

function FeedSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Carregando o feed do estado…</span>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-44 w-full" />
      ))}
    </div>
  )
}

const EMPTY_TEXT = {
  all: 'Não há alertas, notícias nem eventos ativos para esta região agora.',
  alert: 'Não há alertas para esta região.',
  news: 'Não há notícias para esta região.',
  event: 'Não há eventos para esta região.',
}

/**
 * Estado: alertas, notícias e eventos de todo o estado de São Paulo (conteúdo
 * fictício). A visão "Tudo" mostra só o que ainda vale; cada tipo, quando
 * escolhido, também lista o que já encerrou.
 */
export function StateFeedPage() {
  const { account } = useSession()
  const { now, offsetMs } = useClock()
  const navigate = useNavigate()
  const saveEvent = useSaveEvent()

  const [filter, setFilter] = useState('all')
  const [region, setRegion] = useState('state')

  const accountId = account?.id ?? null
  const followed = account?.followedPlaces ?? []
  const canChooseRegion = followed.length > 0
  const cityIds = canChooseRegion && region === 'mine' ? cityIdsOf(followed) : null

  const query = useQuery({
    queryKey: ['state', { accountId, offsetMs }],
    queryFn: () => listStateItems({ accountId }),
  })

  const items = query.data
    ? sortStateItems(
        filterStateItems(query.data, {
          filter,
          cityIds,
          savedIds: new Set(query.data.filter((i) => i.saved).map((i) => i.id)),
          now,
        }),
        now,
      )
    : []

  const renderItem = (item) => (
    <li key={item.id}>
      <StateItem
        item={item}
        now={now}
        savePending={saveEvent.pendingId === item.id}
        onToggleSave={() => saveEvent.toggle(item)}
        onOpen={() => navigate(`/estado/${item.id}`)}
      />
    </li>
  )

  const sections = filter === 'all' ? groupByKind(items) : null

  return (
    <Page
      title="Estado"
      description="Alertas, notícias e eventos de todo o estado de São Paulo."
    >
      <Notice tone="info" title="Conteúdo de demonstração">
        <p>
          Tudo aqui é inventado, inclusive as instituições. Nenhum alerta ou evento deste
          protótipo é real: não tome decisões com base neles.
        </p>
      </Notice>

      {canChooseRegion && (
        <div role="group" aria-label="Região" className="flex flex-wrap gap-2">
          {REGION_SCOPES.map((r) => (
            <Chip key={r.id} selected={region === r.id} onClick={() => setRegion(r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>
      )}

      <div role="group" aria-label="Tipo de conteúdo" className="flex flex-wrap gap-2">
        {STATE_FILTERS.map((f) => (
          <Chip key={f.id} selected={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {query.isPending && <FeedSkeleton />}
      {query.isError && (
        <ErrorState
          title="Não foi possível carregar o feed"
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess && items.length === 0 && (
        <EmptyState
          illustration={<EmptyIllustration />}
          title={filter === 'saved' ? 'Nenhum evento salvo' : 'Nada por aqui'}
          description={
            filter === 'saved'
              ? account
                ? 'Toque em “Salvar” em um evento para encontrá-lo aqui depois.'
                : 'Entre na sua conta para salvar eventos e encontrá-los aqui.'
              : EMPTY_TEXT[filter]
          }
        />
      )}

      {sections &&
        [
          ['alerts', 'Alertas'],
          ['news', 'Notícias'],
          ['events', 'Próximos eventos'],
        ].map(([key, heading]) =>
          sections[key].length > 0 ? (
            <section
              key={key}
              aria-labelledby={`state-${key}`}
              className="flex flex-col gap-3"
            >
              <h2 id={`state-${key}`} className="font-display text-lg font-bold text-ink">
                {heading}
              </h2>
              <ul className="flex flex-col gap-4">{sections[key].map(renderItem)}</ul>
            </section>
          ) : null,
        )}

      {!sections && items.length > 0 && (
        <ul className="flex flex-col gap-4">{items.map(renderItem)}</ul>
      )}
    </Page>
  )
}
