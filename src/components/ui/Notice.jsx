import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { Icon } from './Icon.jsx'

const TONES = {
  info: { icon: Info, classes: 'bg-primary-soft text-primary-ink', role: undefined },
  warn: { icon: TriangleAlert, classes: 'bg-warn-soft text-warn-ink', role: undefined },
  danger: { icon: CircleAlert, classes: 'bg-danger-soft text-danger-ink', role: 'alert' },
}

/**
 * Aviso dentro da página (diferente do Toast, que some sozinho).
 * Ícone + texto: o tom nunca depende só da cor. `danger` é anunciado na hora
 * por leitores de tela (role="alert").
 */
export function Notice({ tone = 'info', title, children, className = '' }) {
  const { icon, classes, role } = TONES[tone]
  return (
    <div
      role={role}
      className={`hairline flex gap-3 rounded-card border-(--badge-border) p-3.5 text-sm ${classes} ${className}`}
    >
      <Icon icon={icon} className="mt-0.5" />
      <div className="flex flex-col gap-1">
        {title && <p className="font-bold">{title}</p>}
        <div className="flex flex-col gap-1">{children}</div>
      </div>
    </div>
  )
}
