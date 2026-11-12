// Utilitários de cor usados SÓ nos testes de tema (validação de contraste e de
// distinção de cores). Não fazem parte do código de produção.

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/** Luminância relativa (WCAG 2.x). */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste WCAG entre duas cores. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Matrizes de simulação de deficiência de visão de cores (Machado et al., 2009,
// severidade máxima), aplicadas em RGB linear. É uma aproximação para triagem;
// não substitui o emulador do DevTools nem teste com pessoas daltônicas.
const CVD = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}

export function simulate(hex, kind) {
  const lin = hexToRgb(hex).map(toLinear)
  const m = CVD[kind]
  return m.map((row) => {
    const v = row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]
    return toSrgb(Math.min(1, Math.max(0, v)))
  })
}

function rgbToLab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear)
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

/** Diferença de cor (CIE76) entre duas cores, depois de simular a deficiência. */
export function deltaEUnder(hexA, hexB, kind) {
  const a = rgbToLab(simulate(hexA, kind))
  const b = rgbToLab(simulate(hexB, kind))
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}
