import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import { COLOR_MODES } from '../../config/colorModes.js'
import { useAccessibility } from '../../context/AccessibilityContext.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { Logo } from '../../components/layout/Logo.jsx'
import {
  BadgesSection,
  CardsSection,
  ColorsSection,
  ControlsSection,
  FormsSection,
  IconsSection,
  OverlaysSection,
  StatesSection,
  TimelineSection,
  TypographySection,
} from './DesignSystemSections.jsx'

const DISPLAY_FONTS = [
  {
    id: 'sora',
    label: 'Sora',
    css: "'Sora Variable', 'Atkinson Hyperlegible', system-ui, sans-serif",
  },
  {
    id: 'bricolage',
    label: 'Bricolage Grotesque',
    css: "'Bricolage Grotesque Variable', 'Atkinson Hyperlegible', system-ui, sans-serif",
  },
]

/**
 * Guia de estilo vivo (rota interna /dev/design-system). Serve para revisar a
 * identidade visual e os componentes antes de usá-los nas funcionalidades.
 * Não faz parte da experiência do cidadão.
 */
export function DesignSystemPage() {
  const { colorMode, setColorMode, largeIcons, setLargeIcons } = useAccessibility()
  const [fontId, setFontId] = useState('sora')
  const font = DISPLAY_FONTS.find((f) => f.id === fontId)

  return (
    <div
      style={{ '--font-display-choice': font.css }}
      className="min-h-dvh bg-canvas text-ink"
    >
      <div className="hairline sticky top-0 z-30 border-x-0 border-t-0 border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Logo />
            <Link
              to="/inicio"
              className="hairline inline-flex min-h-(--tap-min) items-center gap-2 rounded-control border-primary px-4 font-bold text-primary"
            >
              <Icon icon={Smartphone} />
              Ver o app na moldura
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <div
              role="group"
              aria-label="Modo de cor"
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-sm font-bold">Modo de cor:</span>
              {COLOR_MODES.map((mode) => (
                <Chip
                  key={mode.id}
                  selected={colorMode === mode.id}
                  onClick={() => setColorMode(mode.id)}
                  title={mode.hint}
                >
                  {mode.label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold">Ícones:</span>
              <Chip selected={largeIcons} onClick={() => setLargeIcons((v) => !v)}>
                Ícones grandes
              </Chip>
              <span className="ml-2 text-sm font-bold">Fonte dos títulos:</span>
              <span role="group" aria-label="Fonte dos títulos" className="flex gap-2">
                {DISPLAY_FONTS.map((f) => (
                  <Chip
                    key={f.id}
                    selected={fontId === f.id}
                    onClick={() => setFontId(f.id)}
                  >
                    {f.label}
                  </Chip>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
        <header>
          <h1 className="font-display text-4xl font-bold text-ink">Guia de estilo</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Identidade visual e componentes da Etapa 1. Todo conteúdo de exemplo é
            fictício. Use o topo para testar os modos de cor, ícones grandes e as duas
            fontes de título.
          </p>
        </header>
        <ColorsSection />
        <TypographySection />
        <IconsSection />
        <ControlsSection />
        <BadgesSection />
        <FormsSection />
        <CardsSection />
        <TimelineSection />
        <StatesSection />
        <OverlaysSection />
      </main>
    </div>
  )
}
