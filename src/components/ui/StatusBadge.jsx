import { CircleCheck, CircleX, Eye, Inbox, Send, Wrench } from 'lucide-react'
import { getStatus } from '../../domain/reportStatus.js'
import { Badge } from './Badge.jsx'

const APPEARANCE = {
  received: { icon: Inbox, tone: 'neutral' },
  in_review: { icon: Eye, tone: 'info' },
  forwarded: { icon: Send, tone: 'info' },
  in_progress: { icon: Wrench, tone: 'info' },
  resolved: { icon: CircleCheck, tone: 'ok' },
  not_applicable: { icon: CircleX, tone: 'neutral' },
}

/** Status de um relato, com ícone e texto. */
export function StatusBadge({ status, className = '' }) {
  const { label } = getStatus(status)
  const { icon, tone } = APPEARANCE[status]
  return (
    <Badge tone={tone} icon={icon} className={className}>
      {label}
    </Badge>
  )
}
