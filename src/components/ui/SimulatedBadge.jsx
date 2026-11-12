import { FlaskConical } from 'lucide-react'
import { Icon } from './Icon.jsx'

/**
 * Marca tudo o que é simulado nesta versão (dados, atualizações, previsões).
 * Borda tracejada + ícone de frasco + texto: nunca depende só de cor.
 */
export function SimulatedBadge({ children = 'Simulado', className = '' }) {
  return (
    <span
      className={`hairline inline-flex items-center gap-1.5 rounded-full border-dashed border-line-strong bg-surface px-2.5 py-1 text-[0.8125rem] leading-tight font-bold text-ink-muted ${className}`}
    >
      <Icon icon={FlaskConical} size="sm" />
      {children}
    </span>
  )
}
