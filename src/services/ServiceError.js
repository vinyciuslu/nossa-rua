/**
 * Erro de serviço com um `code` estável (para a tela decidir o que mostrar)
 * e uma mensagem em português pronta para exibição.
 */
export class ServiceError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
  }
}
