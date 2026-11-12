import { createContext, useContext } from 'react'

/**
 * Onde sheets e toasts devem "aparecer".
 *
 * No desktop o app vive dentro de uma moldura de smartphone. Se um modal fosse
 * renderizado em document.body, ele cobriria a janela inteira e escaparia da
 * moldura. Por isso a tela do celular se registra aqui e os componentes que
 * precisam sobrepor conteúdo usam um portal para ELA.
 *
 * Sem provedor (ex.: testes isolados), o alvo cai para document.body.
 */
const ScreenPortalContext = createContext(undefined)

export function ScreenPortalProvider({ element, children }) {
  return <ScreenPortalContext value={element}>{children}</ScreenPortalContext>
}

export function useScreenPortalTarget() {
  const target = useContext(ScreenPortalContext)
  return target === undefined ? document.body : target
}
