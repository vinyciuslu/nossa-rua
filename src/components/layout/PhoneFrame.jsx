import { useState } from 'react'
import { ScreenPortalProvider } from '../ui/ScreenPortal.jsx'

/**
 * Moldura de smartphone.
 *
 *  - Em janelas grandes (>= 768 x 700, variante `frame` do index.css) o app aparece
 *    dentro de um aparelho fictício centralizado.
 *  - Em qualquer tela menor (celular real, tablet em pé, janela pequena) a moldura
 *    some: o app ocupa a tela toda, como um aplicativo comum.
 *
 * Decisões técnicas:
 *  - NÃO usamos transform: scale() para encolher a moldura: ele distorce as
 *    coordenadas de toque e arraste em mapas. A altura simplesmente acompanha a
 *    janela (min(868px, 100dvh - 2rem)) e o conteúdo rola por dentro.
 *  - Nada aqui usa position: fixed. Sheets e toasts são `absolute` dentro da tela
 *    do aparelho (ver ScreenPortal), então ficam presos à moldura.
 *  - 100dvh (e não 100vh) porque em celulares a barra do navegador muda de altura.
 *  - A "ilha" do topo é só visual: decoração opcional, fácil de remover.
 */
export function PhoneFrame({ children }) {
  const [screen, setScreen] = useState(null)

  return (
    <div className="flex min-h-dvh items-center justify-center frame:bg-surface-warm">
      <div className="h-dvh w-full frame:h-[min(868px,calc(100dvh-2rem))] frame:w-[414px] frame:rounded-[56px] frame:bg-ink frame:p-3 frame:shadow-frame">
        <div
          ref={setScreen}
          className="relative isolate flex h-full w-full flex-col overflow-hidden bg-canvas frame:rounded-[44px]"
        >
          <div
            aria-hidden="true"
            className="absolute top-3 left-1/2 z-50 hidden h-7 w-28 -translate-x-1/2 rounded-full bg-black frame:block"
          />
          <ScreenPortalProvider element={screen}>{children}</ScreenPortalProvider>
        </div>
      </div>
    </div>
  )
}
