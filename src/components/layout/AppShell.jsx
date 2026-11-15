import { Suspense, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNavigation } from './BottomNavigation.jsx'
import { Header } from './Header.jsx'
import { RouteFallback } from './RouteFallback.jsx'
import { useRouteFocus } from './useRouteFocus.js'

/**
 * Estrutura de toda tela do app: cabeçalho, conteúdo rolável e navegação inferior.
 * É uma coluna flex: só o <main> rola, então cabeçalho e navegação ficam sempre
 * visíveis sem precisar de position: fixed.
 */
export function AppShell() {
  const mainRef = useRef(null)
  useRouteFocus(mainRef)
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-on-primary"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main
        ref={mainRef}
        id="conteudo"
        tabIndex={-1}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none"
      >
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNavigation />
    </>
  )
}
