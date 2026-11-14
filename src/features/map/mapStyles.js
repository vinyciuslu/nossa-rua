/**
 * Como cada nível de trânsito é desenhado no mapa. A cor sozinha não basta
 * (daltonismo, tela com brilho forte): cada nível também muda o PADRÃO do traço.
 *
 *   livre      linha contínua, fina
 *   moderado   tracejada
 *   intenso    pontilhada e bem mais grossa
 *   sem leitura  pontilhada fina, em cinza
 *
 * A cor em si vem do CSS (map.css), pelos mesmos tokens do resto do app, então
 * acompanha o modo de cor escolhido (inclusive alto contraste).
 */
export const TRAFFIC_STYLES = {
  free: { className: 'nr-line-free', weight: 5, dashArray: null },
  moderate: { className: 'nr-line-moderate', weight: 6, dashArray: '14 9' },
  heavy: { className: 'nr-line-heavy', weight: 9, dashArray: '2 11' },
  unknown: { className: 'nr-line-unknown', weight: 4, dashArray: '3 7' },
}

export function trafficLineStyle(level) {
  const style = TRAFFIC_STYLES[level] ?? TRAFFIC_STYLES.unknown
  return { ...style, lineCap: style.dashArray ? 'round' : 'butt', opacity: 1 }
}
