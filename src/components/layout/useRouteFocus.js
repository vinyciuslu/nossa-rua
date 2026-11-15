import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Ao trocar de tela (mudou o caminho), leva o foco para o conteúdo e volta a rolagem
 * ao topo. Num app de página única o navegador não faz isso sozinho: sem isso, quem usa
 * teclado ou leitor de tela continua no link que clicou, na tela antiga.
 *
 * Não age na primeira exibição (a página acabou de abrir) nem quando só muda a busca
 * ou o trecho "#" do endereço.
 */
export function useRouteFocus(ref) {
  const { pathname } = useLocation()
  const previous = useRef(pathname)

  useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    const element = ref.current
    if (!element) return
    element.scrollTo?.({ top: 0 })
    element.focus({ preventScroll: true })
  }, [pathname, ref])
}
