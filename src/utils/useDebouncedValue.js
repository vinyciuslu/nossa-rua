import { useEffect, useState } from 'react'

/** Devolve `value` só depois de ficar parado por `delay` ms (evita consultar a cada tecla). */
export function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
