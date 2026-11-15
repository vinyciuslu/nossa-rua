import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Page } from '../../components/layout/Page.jsx'
import { PostListItem } from '../../components/post/PostListItem.jsx'
import { EmptyIllustration } from '../../components/illustrations/Illustrations.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { useClock } from '../../context/ClockContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { listPostsByAuthor } from '../../services/postService.js'

/**
 * O que a própria pessoa publicou. Para moradores, é onde se acompanha o andamento
 * dos relatos (a linha do tempo completa fica no detalhe); para comércios, os anúncios.
 */
export function MyPostsPage() {
  const { account } = useSession()
  const { now, offsetMs } = useClock()
  const navigate = useNavigate()
  const isCompany = account.type === 'cnpj'
  const query = useQuery({
    queryKey: ['my-posts', account.id, { offsetMs }],
    queryFn: () => listPostsByAuthor(account.id),
  })

  return (
    <Page
      title={isCompany ? 'Meus anúncios' : 'Meus relatos'}
      description={
        isCompany
          ? 'Anúncios publicados pelo seu comércio.'
          : 'Relatos que você publicou. Abra um para ver o histórico completo.'
      }
      backTo="/perfil"
      backLabel="Voltar ao perfil"
    >
      {query.isPending && (
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Carregando…</span>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {query.isError && (
        <ErrorState
          title="Não foi possível carregar"
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      )}
      {query.isSuccess && query.data.length === 0 && (
        <EmptyState
          illustration={<EmptyIllustration />}
          title={isCompany ? 'Nenhum anúncio ainda' : 'Você ainda não publicou relatos'}
          description={
            isCompany
              ? 'Os anúncios que você criar aparecem aqui.'
              : 'Quando você relatar um problema do seu bairro, vai acompanhar o andamento por aqui.'
          }
          action={
            <Link
              to={isCompany ? '/anunciar' : '/relatar'}
              className="inline-flex min-h-(--tap-min) items-center font-bold text-primary underline"
            >
              {isCompany ? 'Criar um anúncio' : 'Relatar um problema'}
            </Link>
          }
        />
      )}
      {query.isSuccess && query.data.length > 0 && (
        <ul
          aria-label={isCompany ? 'Seus anúncios' : 'Seus relatos'}
          className="flex flex-col gap-4"
        >
          {query.data.map((post) => (
            <li key={post.id}>
              <PostListItem
                post={post}
                now={now}
                accountId={account.id}
                onOpen={() => navigate(`/publicacao/${post.id}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
