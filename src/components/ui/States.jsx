import { CircleAlert } from 'lucide-react'
import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'

/** Estado vazio: explica POR QUE não há nada e oferece o próximo passo. */
export function EmptyState({ illustration, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {illustration}
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      {description && <p className="max-w-xs text-ink-muted">{description}</p>}
      {action}
    </div>
  )
}

/** Estado de erro: diz o que houve em linguagem simples e permite tentar de novo. */
export function ErrorState({ title = 'Algo deu errado', message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger-ink">
        <Icon icon={CircleAlert} size="lg" />
      </span>
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      {message && <p className="max-w-xs text-ink-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  )
}

/** Bloco de carregamento. Quem usa marca o container com aria-busy="true". */
export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-control bg-line motion-safe:animate-[pulse-soft_1.4s_ease-in-out_infinite] ${className}`}
    />
  )
}
