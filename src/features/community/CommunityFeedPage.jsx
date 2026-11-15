import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, MapPinPlus, Store } from 'lucide-react'
import { EmptyIllustration } from '../../components/illustrations/Illustrations.jsx'
import { Page } from '../../components/layout/Page.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { PlaceSelect } from '../../components/ui/PlaceSelect.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { useClock } from '../../context/ClockContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { can } from '../../domain/account.js'
import { FEED_FILTERS, filterFeed, sortFeed } from '../../domain/feed.js'
import { getNeighborhood } from '../../domain/places.js'
import { listPosts } from '../../services/postService.js'
import { PostListItem } from '../../components/post/PostListItem.jsx'
import { useSupport } from './useSupport.js'

function FeedSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Carregando publicações…</span>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-56 w-full" />
      ))}
    </div>
  )
}

/**
 * Início: publicações dos bairros acompanhados (ou de um bairro escolhido, para
 * quem ainda não entrou). Relatos, avisos e comércio têm formas diferentes.
 */
export function CommunityFeedPage() {
  const { account } = useSession()
  const { now, offsetMs } = useClock()
  const navigate = useNavigate()
  const support = useSupport()

  const [typeFilter, setTypeFilter] = useState('all')
  const [scope, setScope] = useState('all')
  const [visitorPlace, setVisitorPlace] = useState('')

  const followed = account?.followedPlaces ?? []
  const activeScope = followed.some((f) => f.neighborhoodId === scope) ? scope : 'all'
  const neighborhoodIds = account
    ? activeScope === 'all'
      ? followed.map((f) => f.neighborhoodId)
      : [activeScope]
    : visitorPlace
      ? [visitorPlace]
      : []
  const accountId = account?.id ?? null

  const query = useQuery({
    queryKey: ['posts', { neighborhoodIds, accountId, offsetMs }],
    queryFn: () => listPosts({ neighborhoodIds, accountId }),
    enabled: neighborhoodIds.length > 0,
  })

  const posts = query.data ? sortFeed(filterFeed(query.data, typeFilter), now) : []

  return (
    <Page
      title="Início"
      description={
        account
          ? 'O que está acontecendo nos bairros que você acompanha.'
          : 'Escolha um bairro para ver o que está acontecendo nele.'
      }
    >
      <Notice tone="info" title="Conteúdo de demonstração">
        <p>
          Relatos, avisos e anúncios deste protótipo são fictícios e não representam
          ocorrências nem órgãos reais.
        </p>
      </Notice>

      {(!account || can(account, 'report')) && (
        <Button
          icon={Megaphone}
          onClick={() =>
            navigate(account ? '/relatar' : '/entrar', {
              state: account ? undefined : { from: { pathname: '/relatar' } },
            })
          }
        >
          Relatar um problema
        </Button>
      )}
      {can(account, 'publish_commercial') && (
        <Button icon={Store} onClick={() => navigate('/anunciar')}>
          Criar anúncio
        </Button>
      )}

      {!account && (
        <section aria-labelledby="visitor-place" className="flex flex-col gap-3">
          <h2 id="visitor-place" className="sr-only">
            Escolher bairro
          </h2>
          <PlaceSelect value={visitorPlace} onChange={setVisitorPlace} />
          <Link
            to="/entrar"
            className="min-h-(--tap-min) content-center font-bold text-primary underline"
          >
            Entrar para acompanhar bairros e apoiar relatos
          </Link>
        </section>
      )}

      {account && followed.length > 1 && (
        <div role="group" aria-label="Bairro" className="flex flex-wrap gap-2">
          <Chip selected={activeScope === 'all'} onClick={() => setScope('all')}>
            Todos
          </Chip>
          {followed.map((f) => (
            <Chip
              key={f.neighborhoodId}
              selected={activeScope === f.neighborhoodId}
              onClick={() => setScope(f.neighborhoodId)}
            >
              {f.label} · {getNeighborhood(f.neighborhoodId)?.name}
            </Chip>
          ))}
        </div>
      )}

      {neighborhoodIds.length > 0 && (
        <div
          role="group"
          aria-label="Tipo de publicação"
          className="flex flex-wrap gap-2"
        >
          {FEED_FILTERS.map((f) => (
            <Chip
              key={f.id}
              selected={typeFilter === f.id}
              onClick={() => setTypeFilter(f.id)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      )}

      {account && followed.length === 0 && (
        <EmptyState
          illustration={<EmptyIllustration />}
          title="Você ainda não acompanha nenhum bairro"
          description="Escolha os bairros que importam para você e o feed passa a mostrar o que acontece neles."
          action={
            <Button icon={MapPinPlus} onClick={() => navigate('/perfil/bairros')}>
              Escolher bairros
            </Button>
          }
        />
      )}

      {neighborhoodIds.length > 0 && query.isPending && <FeedSkeleton />}
      {query.isError && (
        <ErrorState
          title="Não foi possível carregar o feed"
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      )}
      {query.isSuccess && posts.length === 0 && (
        <EmptyState
          illustration={<EmptyIllustration />}
          title="Nada por aqui"
          description="Não há publicações desse tipo nos bairros escolhidos. Tente outro filtro."
        />
      )}
      {posts.length > 0 && <h2 className="sr-only">Publicações</h2>}
      {posts.length > 0 && (
        <ul aria-label="Publicações" className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostListItem
                post={post}
                now={now}
                accountId={accountId}
                supportPending={support.pendingId === post.id}
                onToggleSupport={() => support.toggle(post)}
                onOpen={() => navigate(`/publicacao/${post.id}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
