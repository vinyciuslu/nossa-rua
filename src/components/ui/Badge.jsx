import { Icon } from './Icon.jsx'

const TONES = {
  neutral: 'hairline border-line-strong bg-surface text-ink',
  info: 'hairline border-(--badge-border) bg-primary-soft text-primary-ink',
  ok: 'hairline border-(--badge-border) bg-ok-soft text-ok-ink',
  warn: 'hairline border-(--badge-border) bg-warn-soft text-warn-ink',
  danger: 'hairline border-(--badge-border) bg-danger-soft text-danger-ink',
  solid: 'bg-primary text-on-primary',
}

/**
 * Selo curto. O significado vem do TEXTO e do ícone; a cor apenas reforça.
 * Em alto contraste os tons "soft" ganham borda (--badge-border no index.css).
 */
export function Badge({ tone = 'neutral', icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] leading-tight font-bold ${TONES[tone]} ${className}`}
    >
      {icon && <Icon icon={icon} size="sm" />}
      {children}
    </span>
  )
}
