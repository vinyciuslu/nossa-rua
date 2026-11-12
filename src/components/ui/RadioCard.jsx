import { useId } from 'react'

/**
 * Opção de escolha única em formato de cartão (radio nativo dentro de um rótulo
 * grande). O cartão marcado muda de borda e fundo, e o próprio radio também
 * mostra o estado, então a escolha não depende só da cor.
 * Use dentro de um <fieldset> com <legend>.
 */
export function RadioCard({ title, description, ...inputProps }) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="hairline flex min-h-(--tap-min) cursor-pointer items-start gap-3 rounded-card border-line-strong bg-surface p-3.5 has-checked:border-primary has-checked:bg-primary-soft has-checked:[border-width:2px]"
    >
      <input
        id={id}
        type="radio"
        className="mt-1 size-5 accent-primary"
        {...inputProps}
      />
      <span className="flex flex-col">
        <span className="font-bold text-ink">{title}</span>
        {description && <span className="text-sm text-ink-muted">{description}</span>}
      </span>
    </label>
  )
}
