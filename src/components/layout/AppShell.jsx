import { Outlet } from 'react-router-dom'
import { BottomNavigation } from './BottomNavigation.jsx'
import { Header } from './Header.jsx'

/**
 * Estrutura de toda tela do app: cabeçalho, conteúdo rolável e navegação inferior.
 * É uma coluna flex: só o <main> rola, então cabeçalho e navegação ficam sempre
 * visíveis sem precisar de position: fixed.
 */
export function AppShell() {
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
        id="conteudo"
        tabIndex={-1}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <Outlet />
      </main>
      <BottomNavigation />
    </>
  )
}
