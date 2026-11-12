import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Preferências de exibição que mudam a aparência do app inteiro.
 *
 * Funcionam por atributos no <html> (data-color-mode, data-icon-size), que os
 * tokens do index.css leem. Assim, trocar de modo não re-renderiza componentes:
 * o CSS faz o trabalho.
 *
 * Nesta etapa os valores vivem só em memória. A persistência (e a tela de
 * Configurações) chegam na Etapa 2, passando pela camada de serviços.
 */
const AccessibilityContext = createContext(null)

export function AccessibilityProvider({ children }) {
  const [colorMode, setColorMode] = useState('default')
  const [largeIcons, setLargeIcons] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.colorMode = colorMode
    root.dataset.iconSize = largeIcons ? 'large' : 'normal'
  }, [colorMode, largeIcons])

  const value = useMemo(
    () => ({ colorMode, setColorMode, largeIcons, setLargeIcons }),
    [colorMode, largeIcons],
  )

  return <AccessibilityContext value={value}>{children}</AccessibilityContext>
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx)
    throw new Error('useAccessibility precisa estar dentro de AccessibilityProvider')
  return ctx
}
