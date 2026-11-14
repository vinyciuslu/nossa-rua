import { TRAFFIC_STYLES } from './mapStyles.js'
import './map.css'

const ITEMS = [
  ['free', 'Livre'],
  ['moderate', 'Moderado'],
  ['heavy', 'Intenso'],
  ['unknown', 'Sem leitura'],
]

/** Legenda do traço no mapa: mostra o PADRÃO de cada nível, não só a cor. */
export function MapLegend() {
  return (
    <ul
      aria-label="Legenda do mapa"
      className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink"
    >
      {ITEMS.map(([level, label]) => {
        const style = TRAFFIC_STYLES[level]
        return (
          <li key={level} className="flex items-center gap-2">
            <svg width="44" height="14" viewBox="0 0 44 14" aria-hidden="true">
              <line
                x1="3"
                y1="7"
                x2="41"
                y2="7"
                className={style.className}
                strokeWidth={style.weight}
                strokeDasharray={style.dashArray ?? undefined}
                strokeLinecap={style.dashArray ? 'round' : 'butt'}
              />
            </svg>
            {label}
          </li>
        )
      })}
    </ul>
  )
}
