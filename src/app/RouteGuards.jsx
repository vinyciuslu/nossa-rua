import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../context/SessionContext.jsx'
import { Skeleton } from '../components/ui/States.jsx'

/**
 * Guardas de rota. Decidem quem pode ver o quê, SOMENTE para organizar a
 * navegação do protótipo: não há segurança real num app sem backend.
 *
 * Enquanto a sessão salva ainda está sendo lida, mostram um carregando em vez
 * de redirecionar, para não expulsar quem já estava logado ao recarregar a página.
 */

function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3 p-4">
      <span className="sr-only">Carregando…</span>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

/** Área do morador/comércio. Visitante vai para /entrar; admin vai para /admin. */
export function RequireResident() {
  const { status, account } = useSession()
  const location = useLocation()
  if (status === 'loading') return <Loading />
  if (!account) return <Navigate to="/entrar" replace state={{ from: location }} />
  if (account.type === 'admin') return <Navigate to="/admin" replace />
  return <Outlet />
}

/** Área administrativa. Quem não for admin vai para /admin/login. */
export function RequireAdmin() {
  const { status, account } = useSession()
  const location = useLocation()
  if (status === 'loading') return <Loading />
  if (account?.type !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

/**
 * Telas só para quem ainda não entrou (entrar, cadastro). Quem já está logado
 * volta para onde estava indo (`state.from`) ou para o perfil.
 */
export function GuestOnly() {
  const { status, account } = useSession()
  const location = useLocation()
  if (status === 'loading') return <Loading />
  if (account) {
    if (account.type === 'admin') return <Navigate to="/admin" replace />
    const from = location.state?.from?.pathname
    return <Navigate to={from && from !== '/entrar' ? from : '/perfil'} replace />
  }
  return <Outlet />
}

/** Variante para /admin/login: admin logado vai direto ao painel. */
export function AdminGuestOnly() {
  const { status, account } = useSession()
  if (status === 'loading') return <Loading />
  if (account?.type === 'admin') return <Navigate to="/admin" replace />
  return <Outlet />
}
