import { useEffect } from 'react'
import { Hammer } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { APP_NAME } from '../../config/appConfig.js'

/** Painel provisório: o acesso já funciona; o conteúdo chega na Etapa 6. */
export function AdminHomePage() {
  useEffect(() => {
    document.title = `Painel · ${APP_NAME}`
  }, [])

  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>
      <p className="max-w-prose text-ink-muted">
        Aqui ficarão a fila de ocorrências, a priorização, a atualização de status e a
        publicação de avisos oficiais da moderação.
      </p>
      <Badge tone="neutral" icon={Hammer}>
        Em construção · chega na Etapa 6
      </Badge>
    </div>
  )
}
