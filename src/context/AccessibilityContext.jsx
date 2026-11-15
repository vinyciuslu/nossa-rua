import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { COLOR_MODES } from '../config/colorModes.js'
import { storage } from '../services/storage.js'

/**
 * Preferências de exibição que mudam a aparência do app inteiro.
 *
 * Funcionam por atributos no <html> (data-color-mode, data-icon-size), que os
 * tokens do index.css leem. Assim, trocar de modo não re-renderiza componentes:
 * o CSS faz o trabalho.
 *
 * As preferências ficam no APARELHO, não na conta: quem precisa de alto contraste
 * precisa dele também na tela de entrada, antes de qualquer login.
 */
const STORAGE_KEY = 'accessibility'
const AccessibilityContext = createContext(null)

/** Lê o valor salvo e descarta o que não for reconhecido (dado antigo ou editado à mão). */
function readSaved() {
  const saved = storage.read(STORAGE_KEY, {})
  return {
    colorMode: COLOR_MODES.some((m) => m.id === saved?.colorMode)
      ? saved.colorMode
      : 'default',
    largeIcons: saved?.largeIcons === true,
    guidedTap: saved?.guidedTap === true,
  }
}

export function AccessibilityProvider({ children }) {
  const [{ colorMode, largeIcons, guidedTap }, setPrefs] = useState(readSaved)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.colorMode = colorMode
    root.dataset.iconSize = largeIcons ? 'large' : 'normal'
    storage.write(STORAGE_KEY, { colorMode, largeIcons, guidedTap })
  }, [colorMode, largeIcons, guidedTap])

  const value = useMemo(
    () => ({
      colorMode,
      largeIcons,
      guidedTap,
      setGuidedTap: (next) => setPrefs((p) => ({ ...p, guidedTap: next === true })),
      setColorMode: (mode) => setPrefs((p) => ({ ...p, colorMode: mode })),
      // aceita valor ou função, como o setState
      setLargeIcons: (next) =>
        setPrefs((p) => ({
          ...p,
          largeIcons: typeof next === 'function' ? next(p.largeIcons) : next,
        })),
    }),
    [colorMode, largeIcons, guidedTap],
  )

  return <AccessibilityContext value={value}>{children}</AccessibilityContext>
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx)
    throw new Error('useAccessibility precisa estar dentro de AccessibilityProvider')
  return ctx
}
