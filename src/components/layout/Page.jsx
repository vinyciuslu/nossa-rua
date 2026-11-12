import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { APP_NAME } from '../../config/appConfig.js'
import { Icon } from '../ui/Icon.jsx'

/**
 * Esqueleto de uma tela: título (h1), descrição e, se houver, link "Voltar".
 * Também atualiza o título da aba/janela, que leitores de tela anunciam ao
 * navegar entre telas.
 */
export function Page({ title, description, backTo, backLabel = 'Voltar', children }) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`
  }, [title])

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 pb-8">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex min-h-(--tap-min) w-fit items-center gap-1.5 rounded-control pr-2 font-bold text-primary"
        >
          <Icon icon={ArrowLeft} />
          {backLabel}
        </Link>
      )}
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="text-ink-muted">{description}</p>}
      </header>
      {children}
    </div>
  )
}
