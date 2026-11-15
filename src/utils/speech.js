/** Narração pela voz do próprio aparelho (SpeechSynthesis). Nada é enviado para a internet. */

export const isSpeechSupported = () =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function'

/** Fala o texto em português do Brasil, interrompendo o que estiver sendo falado. */
export function speak(text) {
  if (!isSpeechSupported()) return false
  const utterance = new window.SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-BR'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
