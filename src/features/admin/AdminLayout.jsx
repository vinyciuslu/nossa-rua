import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Logo } from '../../components/layout/Logo.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useSession } from '../../context/SessionContext.jsx'

const SECTIONS = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/ocorrencias', label: 'Ocorrências' },
  { to: '/admin/avisos', label: 'Avisos' },
  { to: '/admin/parametros', label: 'Parâmetros' },
]

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
        <nav aria-label="Seções da administração" className="mx-auto max-w-6xl px-4">
          <ul className="flex flex-wrap gap-1">
            {SECTIONS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `inline-flex min-h-(--tap-min) items-center border-b-4 px-3 font-bold ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-ink-muted hover:text-ink'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
