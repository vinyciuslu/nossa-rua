import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { Icon } from './Icon.jsx'
import { useScreenPortalTarget } from './ScreenPortal.jsx'

const ToastContext = createContext(null)

const TONES = {
  info: { icon: Info, classes: 'bg-ink text-canvas' },
  success: { icon: CircleCheck, classes: 'bg-ok-ink text-white' },
  error: { icon: CircleAlert, classes: 'bg-danger-ink text-white' },
}

const DURATION_MS = 6000

/**
 * Feedback curto de uma ação ("Apoio registrado"). A região é role="status", que
 * leitores de tela anunciam sem tirar o foco do usuário. Dura 6 s e pode ser
 * dispensada antes. Precisa ficar DENTRO da tela do celular (ver ScreenPortal).
 */
export function ToastProvider({ children }) {
  const target = useScreenPortalTarget()
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message, { tone = 'info' } = {}) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, tone }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext value={value}>
      {children}
      {target &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-x-4 bottom-24 z-50 flex flex-col gap-2"
          >
            {toasts.map(({ id, message, tone }) => {
              const { icon, classes } = TONES[tone]
              return (
                <div
                  key={id}
                  className={`pointer-events-auto flex items-center gap-3 rounded-control px-4 py-3 shadow-sheet motion-safe:animate-[toast-in_0.2s_ease-out] ${classes}`}
                >
                  <Icon icon={icon} />
                  <p className="flex-1 text-sm font-bold">{message}</p>
                  <button
                    type="button"
                    aria-label="Dispensar aviso"
                    onClick={() => dismiss(id)}
                    className="inline-flex size-(--tap-min) items-center justify-center rounded-full"
                  >
                    <Icon icon={X} size="sm" />
                  </button>
                </div>
              )
            })}
          </div>,
          target,
        )}
    </ToastContext>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider')
  return ctx
}
