import { useId } from 'react'

/**
 * Campos de formulário acessíveis: rótulo visível ligado ao campo, dica e erro
 * ligados por aria-describedby, e "obrigatório" escrito (não só um asterisco).
 *
 * São componentes simples de propósito. Na Etapa 2 entram React Hook Form + Zod,
 * que se encaixam aqui via `ref` e `{...register('campo')}`.
 */
function FieldShell({ id, label, hint, error, required, children }) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
        {required && <span className="font-normal text-ink-muted"> (obrigatório)</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby':
          [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-bold text-danger-ink">
          {error}
        </p>
      )}
    </div>
  )
}

const CONTROL =
  'hairline min-h-(--tap-min) w-full rounded-control bg-surface px-3.5 py-2 text-ink placeholder:text-ink-muted aria-[invalid=true]:border-danger aria-[invalid=true]:border-2'
const BORDER = 'border-line-strong'

export function TextField({ label, hint, error, required, ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <input
          required={required}
          className={`${CONTROL} ${BORDER}`}
          {...a11y}
          {...props}
        />
      )}
    </FieldShell>
  )
}

export function TextAreaField({ label, hint, error, required, rows = 4, ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <textarea
          required={required}
          rows={rows}
          className={`${CONTROL} ${BORDER} resize-y`}
          {...a11y}
          {...props}
        />
      )}
    </FieldShell>
  )
}

export function SelectField({ label, hint, error, required, children, ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {(a11y) => (
        <select
          required={required}
          className={`${CONTROL} ${BORDER}`}
          {...a11y}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
}
