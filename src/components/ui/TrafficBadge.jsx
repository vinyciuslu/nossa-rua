import { CircleCheck, OctagonAlert, TriangleAlert, WifiOff } from 'lucide-react'
import { Badge } from './Badge.jsx'

/**
 * Nível de trânsito. Cor + ÍCONE + RÓTULO, sempre juntos.
 * A classificação, a partir da velocidade, está em `domain/traffic.js`. "Sem leitura"
 * é o sensor sem sinal: o app não inventa um nível nesse caso.
 */
const LEVELS = {
  free: { label: 'Trânsito livre', icon: CircleCheck, tone: 'ok' },
  moderate: { label: 'Trânsito moderado', icon: TriangleAlert, tone: 'warn' },
  heavy: { label: 'Congestionamento intenso', icon: OctagonAlert, tone: 'danger' },
  unknown: { label: 'Sem leitura do sensor', icon: WifiOff, tone: 'neutral' },
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
