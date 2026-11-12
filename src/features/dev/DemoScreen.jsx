import { useState } from 'react'
import { ScreenPortalProvider } from '../../components/ui/ScreenPortal.jsx'
import { ToastProvider } from '../../components/ui/Toast.jsx'

/**
 * Mini tela de celular para demonstrar componentes que se sobrepõem ao conteúdo
 * (BottomSheet, Toast). Faz o mesmo papel da PhoneFrame: registra o próprio
 * elemento como alvo de portal, de modo que sheets e toasts fiquem presos nela.
 */
export function DemoScreen({ children }) {
  const [screen, setScreen] = useState(null)
  return (
    <div
      ref={setScreen}
      className="relative isolate h-[480px] w-full max-w-[360px] overflow-hidden rounded-[28px] border-4 border-ink bg-canvas"
    >
      <ScreenPortalProvider element={screen}>
        <ToastProvider>{children}</ToastProvider>
      </ScreenPortalProvider>
    </div>
  )
}
