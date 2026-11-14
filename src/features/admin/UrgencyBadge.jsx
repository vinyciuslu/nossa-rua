import { ChevronUp, ChevronsUp, Minus } from 'lucide-react'
import { Badge } from '../../components/ui/Badge.jsx'
import { URGENCY_LEVELS } from '../../domain/priority.js'

const APPEARANCE = {
  high: { icon: ChevronsUp, tone: 'danger' },
  medium: { icon: ChevronUp, tone: 'warn' },
  low: { icon: Minus, tone: 'neutral' },
}

/** Nível de urgência em texto e ícone; a cor só reforça. */
export function UrgencyBadge({ level }) {
  const { icon, tone } = APPEARANCE[level]
  return (
    <Badge tone={tone} icon={icon}>
      Urgência {URGENCY_LEVELS[level].label.toLowerCase()}
    </Badge>
  )
}
