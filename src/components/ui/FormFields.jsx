import { useId } from 'react'

/**
 * Campos de formulário acessíveis: rótulo visível ligado ao campo, dica e erro
 * ligados por aria-describedby, e "obrigatório" escrito (não só um asterisco).
 *
 * São componentes simples de propósito. Funcionam com ou sem React Hook Form:
 * `{...register('campo')}` entrega name, onChange, onBlur e ref, que vão direto
 * para o elemento (em React 19 o `ref` chega como propriedade comum).
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

/** Caixa de seleção com rótulo clicável. O texto pode conter links (children). */
export function CheckboxField({ label, error, ...props }) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-6 shrink-0 accent-primary"
          {...props}
        />
        <label htmlFor={id} className="text-ink">
          {label}
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm font-bold text-danger-ink">
          {error}
        </p>
      )}
    </div>
  )
}
