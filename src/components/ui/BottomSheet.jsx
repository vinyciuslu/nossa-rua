import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button.jsx'
import { useScreenPortalTarget } from './ScreenPortal.jsx'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Painel que sobe da parte de baixo da tela do celular (detalhes de mapa, filtros,
 * confirmações). Renderiza dentro da tela do aparelho via portal.
 *
 * Por que não <dialog>.showModal()? Ele usa a "camada superior" do navegador e
 * escaparia da moldura de smartphone, cobrindo a janela inteira.
 *
 * Acessibilidade: role="dialog" + aria-modal, foco vai para dentro ao abrir e
 * volta ao elemento de origem ao fechar, Esc fecha, Tab fica preso no painel.
 */
export function BottomSheet({ open, onClose, title, children }) {
  const target = useScreenPortalTarget()
  const panelRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const first = panelRef.current?.querySelector(FOCUSABLE)
    ;(first ?? panelRef.current)?.focus()
    return () => opener?.focus?.()
  }, [open])

  if (!open || !target) return null

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const items = [...panelRef.current.querySelectorAll(FOCUSABLE)]
    if (items.length === 0) {
      event.preventDefault()
      return
    }
    const firstItem = items[0]
    const lastItem = items.at(-1)
    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault()
      lastItem.focus()
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault()
      firstItem.focus()
    }
  }

  return createPortal(
    <div className="absolute inset-0 z-40 flex items-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 motion-safe:animate-[fade-in_0.2s_ease-out]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative max-h-[88%] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-sheet motion-safe:animate-[sheet-up_0.28s_var(--ease-out-soft)]"
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line-strong"
        />
        <div className="flex items-center justify-between gap-2 px-5 pt-2">
          <h2 id={titleId} className="font-display text-lg font-bold text-ink">
            {title}
          </h2>
          <IconButton icon={X} label="Fechar" onClick={onClose} />
        </div>
        <div className="px-5 pb-6 pt-2">{children}</div>
      </div>
    </div>,
    target,
  )
}
