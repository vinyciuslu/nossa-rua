import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Logo } from '../../components/layout/Logo.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useSession } from '../../context/SessionContext.jsx'

/**
 * Moldura do painel administrativo: página comum, em tela larga e sem a moldura
 * de smartphone, porque o painel é uma ferramenta de trabalho em computador.
 */
export function AdminLayout() {
  const { account, signOut } = useSession()
  const navigate = useNavigate()

  async function onSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="hairline border-x-0 border-t-0 border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary-ink">
              Administração
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-muted">{account.name}</span>
            <Button variant="secondary" icon={LogOut} onClick={onSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
