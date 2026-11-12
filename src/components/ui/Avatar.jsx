import { getInitials } from '../../domain/account.js'

/** Círculo com as iniciais. Decorativo: o nome da pessoa aparece ao lado, em texto. */
export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = { md: 'size-(--tap-min) text-base', lg: 'size-16 text-xl' }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-on-primary ${sizes[size]} ${className}`}
    >
      {getInitials(name)}
    </span>
  )
}
