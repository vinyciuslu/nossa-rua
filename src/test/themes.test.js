import { describe, expect, it } from 'vitest'
import { contrast, deltaEUnder } from './color.js'
import { loadThemes } from './themes.js'

const themes = loadThemes()

// Pares de texto: precisam de razão de contraste >= 4,5 (WCAG AA, texto normal).
const TEXT_PAIRS = [
  ['ink', 'canvas'],
  ['ink', 'surface'],
  ['ink-muted', 'canvas'],
  ['ink-muted', 'surface'],
  ['ink', 'surface-warm'],
  ['ink-muted', 'surface-warm'],
  ['on-primary', 'primary'],
  ['on-accent', 'accent'],
  ['primary-ink', 'primary-soft'],
  ['primary', 'surface'],
  ['ok-ink', 'ok-soft'],
  ['warn-ink', 'warn-soft'],
  ['danger-ink', 'danger-soft'],
]

// Elementos gráficos (bordas de campos, foco, ícones de estado): >= 3 (WCAG 1.4.11).
const GRAPHIC_PAIRS = [
  ['line-strong', 'canvas'],
  ['line-strong', 'surface'],
  ['focus', 'canvas'],
  ['focus', 'surface'],
  ['ok', 'surface'],
  ['warn', 'surface'],
  ['danger', 'surface'],
  ['ok', 'ok-soft'],
  ['warn', 'warn-soft'],
  ['danger', 'danger-soft'],
]

describe.each(Object.keys(themes))('modo de cor "%s"', (mode) => {
  const t = themes[mode]

  it.each(TEXT_PAIRS)('texto %s sobre %s tem contraste >= 4,5', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(GRAPHIC_PAIRS)('elemento %s sobre %s tem contraste >= 3', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(3)
  })
})

// Triagem (heurística) de distinção entre "bom / atenção / ruim" sob simulação de
// daltonismo. Só testamos o que cada modo se propõe a resolver. Os ícones e rótulos
// continuam obrigatórios mesmo se este teste passar.
const MIN_DELTA_E = 25
const LEVEL_PAIRS = [
  ['ok', 'warn'],
  ['warn', 'danger'],
  ['ok', 'danger'],
]

describe.each([
  ['red-green', ['protanopia', 'deuteranopia']],
  ['blue-yellow', ['tritanopia']],
])('distinção de cores no modo "%s"', (mode, kinds) => {
  for (const kind of kinds) {
    it.each(LEVEL_PAIRS)(`%s e %s se distinguem sob ${kind}`, (a, b) => {
      expect(deltaEUnder(themes[mode][a], themes[mode][b], kind)).toBeGreaterThanOrEqual(
        MIN_DELTA_E,
      )
    })
  }
})
