import { NavLink } from 'react-router-dom'
import { House, Landmark, Map } from 'lucide-react'
import { Icon } from '../ui/Icon.jsx'

const TABS = [
  { to: '/inicio', label: 'Início', icon: House },
  { to: '/estado', label: 'Estado', icon: Landmark },
  { to: '/mapa', label: 'Mapa', icon: Map },
]

/**
 * Navegação principal. Ícone + texto em cada aba. A aba ativa se destaca por
 * forma (pílula com borda), peso do texto e aria-current, não só por cor.
 */
export function BottomNavigation() {
  return (
    <nav
      aria-label="Navegação principal"
      className="hairline shrink-0 border-x-0 border-b-0 border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-3">
        {TABS.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-(--tap-min) flex-col items-center gap-1 px-2 py-2 text-[0.8125rem] ${
                  isActive ? 'font-bold text-primary-ink' : 'font-normal text-ink-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`hairline flex h-8 min-w-14 items-center justify-center rounded-full px-4 transition-colors ${
                      isActive ? 'border-primary bg-primary-soft' : 'border-transparent'
                    }`}
                  >
                    <Icon icon={icon} size="lg" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
