import { COLOR_MODES } from '../../config/colorModes.js'
import { useAccessibility } from '../../context/AccessibilityContext.jsx'
import { Chip } from '../../components/ui/Chip.jsx'

/**
 * Controles de acessibilidade visual. Valem para o aparelho todo, inclusive antes
 * do login, e são aplicados na hora (a pessoa vê o resultado enquanto escolhe).
 */
export function AccessibilitySettings() {
  const { colorMode, setColorMode, largeIcons, setLargeIcons } = useAccessibility()
  const current = COLOR_MODES.find((m) => m.id === colorMode)

  return (
    <div className="flex flex-col gap-5">
      <div
        role="group"
        aria-labelledby="color-mode-label"
        className="flex flex-col gap-2"
      >
        <h3 id="color-mode-label" className="font-bold text-ink">
          Modo de cor
        </h3>
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
        <h3 id="icon-size-label" className="font-bold text-ink">
          Tamanho dos ícones e botões
        </h3>
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
    </div>
  )
}
