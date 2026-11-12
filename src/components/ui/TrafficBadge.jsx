import { CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react'
import { Badge } from './Badge.jsx'

/**
 * Nível de trânsito. Cor + ÍCONE + RÓTULO, sempre juntos.
 * (A classificação em si, a partir da velocidade, chega na Etapa 5.)
 */
const LEVELS = {
  free: { label: 'Trânsito livre', icon: CircleCheck, tone: 'ok' },
  moderate: { label: 'Trânsito moderado', icon: TriangleAlert, tone: 'warn' },
  heavy: { label: 'Congestionamento intenso', icon: OctagonAlert, tone: 'danger' },
}

export function TrafficBadge({ level, className = '' }) {
  const info = LEVELS[level]
  if (!info) throw new Error(`Nível de trânsito desconhecido: ${level}`)
  return (
    <Badge tone={info.tone} icon={info.icon} className={className}>
      {info.label}
    </Badge>
  )
}
