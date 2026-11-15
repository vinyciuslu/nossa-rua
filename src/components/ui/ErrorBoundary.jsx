import { Component } from 'react'
import { Button } from './Button.jsx'
import { ErrorState } from './States.jsx'

/**
 * Última rede de segurança: se uma tela quebrar ao desenhar (ou o código de uma tela
 * não baixar, por falta de internet), mostra uma mensagem em vez de uma página em branco.
 * Precisa ser classe: o React ainda só oferece essa captura assim.
 */
export class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    // Sem serviço de monitoramento no protótipo: o console é o único registro.
    console.error('Falha ao desenhar a tela:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 bg-canvas p-4 text-ink">
        <ErrorState
          title="Não foi possível mostrar esta tela"
          message="Algo falhou ao carregar. Verifique a conexão e tente de novo; seus dados neste aparelho não foram afetados."
        />
        <Button onClick={() => window.location.reload()}>Recarregar o app</Button>
      </div>
    )
  }
}
