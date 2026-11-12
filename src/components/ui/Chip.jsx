import { Check as CheckIcon } from 'lucide-react'
import { Icon } from './Icon.jsx'

/** Chip de filtro: alterna entre selecionado e não selecionado (aria-pressed). */
export function Chip({ selected = false, icon, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`hairline inline-flex min-h-(--tap-min) items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition-colors ${
        selected
          ? 'border-primary bg-primary text-on-primary'
          : 'border-line-strong bg-surface text-ink hover:bg-primary-soft'
      } ${className}`}
      {...props}
    >
      {/* Ícone de "marcado" além da cor: o estado não depende só do contraste. */}
      {selected ? (
        <Icon icon={CheckIcon} size="sm" />
      ) : (
        icon && <Icon icon={icon} size="sm" />
      )}
      {children}
    </button>
  )
}
