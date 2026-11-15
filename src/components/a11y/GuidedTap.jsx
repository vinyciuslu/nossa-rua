import { useEffect } from 'react'
import { useAccessibility } from '../../context/AccessibilityContext.jsx'
import { describeElement } from '../../utils/describeElement.js'
import { speak, stopSpeaking } from '../../utils/speech.js'

/** Tempo para o segundo toque valer como "ativar". Depois disso, volta a ser o primeiro. */
export const DOUBLE_TAP_WINDOW_MS = 4000

const INTERACTIVE =
  'a[href], button, summary, [role="button"], [role="link"], [role="tab"], input, textarea, select'

/**
 * Modo opcional de toque duplo: o primeiro toque num botão ou link NÃO o aciona,
 * apenas o descreve em voz alta e o destaca; o segundo toque, no mesmo elemento,
 * aciona de verdade. Ajuda quem quer ouvir o que cada coisa faz antes de tocar.
 *
 * Não substitui VoiceOver nem TalkBack, que oferecem muito mais. Por isso:
 *  - só reage a toque/mouse (`event.detail > 0`): o teclado e os leitores de tela,
 *    que ativam por `click` sem detalhe, passam direto;
 *  - campos de texto não são bloqueados: o primeiro toque só fala o nome do campo.
 *
 * Não desenha nada: o realce é o atributo `data-guided-pending` (ver index.css).
 */
export function GuidedTap() {
  const { guidedTap } = useAccessibility()

  useEffect(() => {
    if (!guidedTap) return undefined

    let pending = null // { element, timer }

    function clearPending() {
      if (!pending) return
      clearTimeout(pending.timer)
      pending.element.removeAttribute('data-guided-pending')
      pending = null
    }

    function onClick(event) {
      if (event.detail === 0) return // teclado, leitor de tela ou clique programático
      const element = event.target.closest?.(INTERACTIVE)
      if (!element) {
        clearPending()
        return
      }
      const description = describeElement(element)
      if (!description) return

      if (description.kind === 'field') {
        speak(description.text) // não bloqueia: a pessoa precisa conseguir escrever
        return
      }

      if (pending?.element === element) {
        clearPending() // segundo toque: deixa o clique seguir
        stopSpeaking()
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()
      clearPending()
      element.setAttribute('data-guided-pending', 'true')
      pending = { element, timer: setTimeout(clearPending, DOUBLE_TAP_WINDOW_MS) }
      const action = description.kind === 'link' ? 'abrir' : 'ativar'
      speak(`${description.text}. Toque de novo para ${action}.`)
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clearPending()
      stopSpeaking()
    }
  }, [guidedTap])

  return null
}
