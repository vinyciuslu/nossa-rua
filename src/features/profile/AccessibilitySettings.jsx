import { COLOR_MODES } from '../../config/colorModes.js'
import { useAccessibility } from '../../context/AccessibilityContext.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { isSpeechSupported, speak } from '../../utils/speech.js'

/**
 * Controles de acessibilidade visual. Valem para o aparelho todo, inclusive antes
 * do login, e são aplicados na hora (a pessoa vê o resultado enquanto escolhe).
 */
export function AccessibilitySettings({ headingLevel: Heading = 'h3' }) {
  const { colorMode, setColorMode, largeIcons, setLargeIcons, guidedTap, setGuidedTap } =
    useAccessibility()
  const current = COLOR_MODES.find((m) => m.id === colorMode)

  return (
    <div className="flex flex-col gap-5">
      <div
        role="group"
        aria-labelledby="color-mode-label"
        className="flex flex-col gap-2"
      >
        <Heading id="color-mode-label" className="font-bold text-ink">
          Modo de cor
        </Heading>
        <div className="flex flex-wrap gap-2">
          {COLOR_MODES.map((mode) => (
            <Chip
              key={mode.id}
              selected={colorMode === mode.id}
              onClick={() => setColorMode(mode.id)}
            >
              {mode.label}
            </Chip>
          ))}
        </div>
        <p className="text-sm text-ink-muted" aria-live="polite">
          {current.hint}
        </p>
      </div>

      <div role="group" aria-labelledby="icon-size-label" className="flex flex-col gap-2">
        <Heading id="icon-size-label" className="font-bold text-ink">
          Tamanho dos ícones e botões
        </Heading>
        <div className="flex flex-wrap gap-2">
          <Chip selected={!largeIcons} onClick={() => setLargeIcons(false)}>
            Padrão
          </Chip>
          <Chip selected={largeIcons} onClick={() => setLargeIcons(true)}>
            Grande
          </Chip>
        </div>
        <p className="text-sm text-ink-muted">
          Ícones e áreas de toque maiores, com texto um pouco ampliado.
        </p>
      </div>

      <div
        role="group"
        aria-labelledby="guided-tap-label"
        className="flex flex-col gap-2"
      >
        <Heading id="guided-tap-label" className="font-bold text-ink">
          Toque duplo com narração
        </Heading>
        <div className="flex flex-wrap gap-2">
          <Chip selected={!guidedTap} onClick={() => setGuidedTap(false)}>
            Desligado
          </Chip>
          <Chip
            selected={guidedTap}
            onClick={() => {
              setGuidedTap(true)
              speak(
                'Toque duplo ligado. Toque uma vez para ouvir, duas vezes para abrir.',
              )
            }}
          >
            Ligado
          </Chip>
        </div>
        <p className="text-sm text-ink-muted">
          Um toque em botão ou link só descreve em voz alta e destaca; o segundo toque, no
          mesmo lugar, abre. Campos de texto funcionam normalmente. Com o modo ligado,
          para desligar toque duas vezes em "Desligado".
        </p>
        {!isSpeechSupported() && (
          <Notice tone="warn" title="Este navegador não tem narração">
            <p>
              O modo ainda destaca o item no primeiro toque e abre no segundo, mas sem
              voz.
            </p>
          </Notice>
        )}
        <p className="text-sm text-ink-muted">
          Este modo é um apoio opcional e não substitui o VoiceOver (iPhone) nem o
          TalkBack (Android), que continuam funcionando normalmente.
        </p>
      </div>
    </div>
  )
}
