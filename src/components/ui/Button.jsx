import { Icon } from './Icon.jsx'

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:brightness-110',
  accent: 'bg-accent text-on-accent hover:brightness-110',
  secondary: 'hairline border-primary bg-surface text-primary hover:bg-primary-soft',
  ghost: 'text-primary hover:bg-primary-soft',
}

/** Botão de texto, com ícone opcional. A área de toque nunca fica menor que --tap-min. */
export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-(--tap-min) items-center justify-center gap-2 rounded-control px-4 py-2 font-bold transition-colors motion-safe:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon && <Icon icon={icon} />}
      {children}
    </button>
  )
}

/** Botão só de ícone. `label` é obrigatório: é o nome acessível do botão. */
export function IconButton({ icon, label, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-(--tap-min) items-center justify-center rounded-full text-ink transition-colors hover:bg-primary-soft ${className}`}
      {...props}
    >
      <Icon icon={icon} size="lg" />
    </button>
  )
}
