import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { Icon } from '../ui/Icon.jsx'
import { Logo } from './Logo.jsx'

/**
 * Cabeçalho do app: marca à esquerda, acesso ao perfil à direita.
 * O padding do topo respeita o notch em celulares reais (safe-area) e, na moldura,
 * deixa espaço para a "ilha" decorativa.
 */
export function Header() {
  return (
    <header className="flex shrink-0 items-center justify-between bg-canvas px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 frame:pt-12">
      <Link
        to="/inicio"
        aria-label="Nossa Rua, ir para o início"
        className="rounded-control"
      >
        <Logo />
      </Link>
      <Link
        to="/perfil"
        aria-label="Meu perfil"
        className="hairline inline-flex size-(--tap-min) items-center justify-center rounded-full border-line-strong bg-surface text-ink"
      >
        <Icon icon={User} size="lg" />
      </Link>
    </header>
  )
}
