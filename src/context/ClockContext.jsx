import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { clock } from '../services/clock.js'

/**
 * Hora do app para as telas. Atualiza a cada minuto (os "há 5 min" andam sozinhos)
 * e na hora em que o relógio de demonstração é mexido. `offsetMs` entra nas chaves
 * das consultas, para que adiantar o relógio recarregue as publicações.
 */
const ClockContext = createContext(null)

export function ClockProvider({ children }) {
  const [state, setState] = useState(() => ({
    now: clock.now(),
    offsetMs: clock.getOffset(),
  }))

  const refresh = useCallback(
    () => setState({ now: clock.now(), offsetMs: clock.getOffset() }),
    [],
  )

  useEffect(() => {
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh])

  const value = useMemo(
    () => ({
      ...state,
      advance(ms) {
        clock.advance(ms)
        refresh()
      },
      reset() {
        clock.reset()
        refresh()
      },
    }),
    [state, refresh],
  )

  return <ClockContext value={value}>{children}</ClockContext>
}

export function useClock() {
  const ctx = useContext(ClockContext)
  if (!ctx) throw new Error('useClock precisa estar dentro de ClockProvider')
  return ctx
}
