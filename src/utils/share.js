/**
 * Compartilha pelo menu do aparelho (Web Share API) e, onde ele não existe
 * (a maioria dos desktops), copia o link.
 *
 * Devolve o que aconteceu, para a tela dizer à pessoa:
 *  'shared' | 'copied' | 'cancelled' | 'unsupported'
 */
export async function shareLink({ title, text, url }) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (error) {
      // Fechar o menu de compartilhar não é erro.
      if (error?.name === 'AbortError') return 'cancelled'
      // Outro erro: tenta copiar abaixo.
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'unsupported'
  }
}
