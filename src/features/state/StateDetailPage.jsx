import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarPlus, Share2 } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { APP_NAME } from '../../config/appConfig.js'
import { useClock } from '../../context/ClockContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { buildIcs, icsFilename } from '../../domain/ics.js'
import { getStateItem } from '../../services/stateService.js'
import { downloadIcs } from '../../utils/download.js'
import { shareLink } from '../../utils/share.js'
import { StateItem } from './StateItem.jsx'
import { useSaveEvent } from './useSaveEvent.js'

const SHARE_MESSAGES = {
  copied: 'Link copiado.',
  unsupported: 'Não foi possível compartilhar neste aparelho.',
}

/** Detalhe de um alerta, notícia ou evento. Eventos podem ser salvos e levados para a agenda. */
export function StateDetailPage() {
  const { id } = useParams()
  const { account } = useSession()
  const { now, offsetMs } = useClock()
  const toast = useToast()
  const saveEvent = useSaveEvent()
  const accountId = account?.id ?? null

  const query = useQuery({
    queryKey: ['state', 'item', id, { accountId, offsetMs }],
    queryFn: () => getStateItem(id, accountId),
    retry: false,
  })
  const item = query.data

  useEffect(() => {
    document.title = `${item?.title ?? 'Estado'} · ${APP_NAME}`
  }, [item?.title])

  async function handleShare() {
    const result = await shareLink({
      title: item.title,
      text: `${item.title} (conteúdo fictício do ${APP_NAME})`,
      url: `${window.location.origin}/estado/${item.id}`,
    })
    const message = SHARE_MESSAGES[result]
    if (message) toast.show(message, { tone: result === 'copied' ? 'info' : 'danger' })
  }

  function handleAddToCalendar() {
    downloadIcs(buildIcs(item, new Date(now)), icsFilename(item))
    toast.show('Arquivo de agenda baixado. Abra-o para adicionar o evento.', {
      tone: 'info',
    })
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 pb-8">
      <Link
        to="/estado"
        className="inline-flex min-h-(--tap-min) w-fit items-center gap-1.5 rounded-control pr-2 font-bold text-primary"
      >
        <Icon icon={ArrowLeft} />
        Voltar ao estado
      </Link>

      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Carregando…</span>
          <Skeleton className="h-56 w-full" />
        </div>
      )}
      {query.isError && (
        <ErrorState title="Conteúdo não encontrado" message={query.error.message} />
      )}

      {item && (
        <>
          <StateItem
            item={item}
            now={now}
            detail
            savePending={saveEvent.pendingId === item.id}
            onToggleSave={() => saveEvent.toggle(item)}
          >
            {item.kind === 'event' && (
              <Button
                variant="secondary"
                icon={CalendarPlus}
                onClick={handleAddToCalendar}
              >
                Adicionar à agenda
              </Button>
            )}
            <Button variant="secondary" icon={Share2} onClick={handleShare}>
              Compartilhar
            </Button>
          </StateItem>
          <Notice tone="info">
            <p>
              Conteúdo fictício de demonstração.
              {item.kind === 'event' &&
                ' O arquivo de agenda leva o aviso “[Demonstração]” no título, para você não confundir com um compromisso real.'}
            </p>
          </Notice>
        </>
      )}
    </div>
  )
}
