import { APP_NAME } from '../../config/appConfig.js'

/** Marca do app: um pino de localização com uma rua dentro, mais o nome. */
export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M16 5.5c-4.7 0-8.2 3.5-8.2 8 0 5.6 6.1 11.1 7.4 12.2a1.2 1.2 0 0 0 1.6 0c1.3-1.1 7.4-6.6 7.4-12.2 0-4.5-3.5-8-8.2-8Z"
          className="fill-on-primary"
        />
        <path
          d="M13.2 21.5 15 11.2h2l1.8 10.3"
          fill="none"
          className="stroke-primary"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 13.4v1.6M16 17v1.6"
          className="stroke-accent"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-ink">
        {APP_NAME}
      </span>
    </span>
  )
}
