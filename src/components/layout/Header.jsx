import { Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { useSession } from '../../context/SessionContext.jsx'
import { Avatar } from '../ui/Avatar.jsx'
import { Icon } from '../ui/Icon.jsx'
import { Logo } from './Logo.jsx'

/**
 * Cabeçalho do app: marca à esquerda; à direita, o perfil (iniciais da pessoa) ou
 * o acesso para entrar.
 * O padding do topo respeita o notch em celulares reais (safe-area) e, na moldura,
 * deixa espaço para a "ilha" decorativa.
 */
export function Header() {
  const { account } = useSession()
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
        aria-label={account ? 'Meu perfil' : 'Entrar'}
        className="inline-flex rounded-full"
      >
        {account ? (
          <Avatar name={account.name} />
        ) : (
          <span className="hairline inline-flex size-(--tap-min) items-center justify-center rounded-full border-line-strong bg-surface text-ink">
            <Icon icon={User} size="lg" />
          </span>
        )}
      </Link>
    </header>
  )
}
