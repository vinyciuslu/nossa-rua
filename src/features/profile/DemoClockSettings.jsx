import { Clock, RotateCcw } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { useClock } from '../../context/ClockContext.jsx'
import { DAYS, HOURS } from '../../domain/relativeTime.js'
import { formatDateTime } from '../../utils/format.js'

function describeOffset(ms) {
  if (ms === 0) return 'Horário real'
  const days = Math.floor(ms / DAYS)
  const hours = Math.floor((ms % DAYS) / HOURS)
  const parts = []
  if (days) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`)
  if (hours) parts.push(`${hours} h`)
  return `Adiantado em ${parts.join(' e ')}`
}

/**
 * Relógio de demonstração (D20): permite adiantar o tempo para ver o ciclo dos
 * relatos avançar sem esperar dias. Vale só neste aparelho e não afeta nada fora dele.
 */
export function DemoClockSettings() {
  const { now, offsetMs, advance, reset } = useClock()
  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">
        Adiante o tempo para ver os relatos mudarem de etapa. Serve só para demonstração.
      </p>
      <p className="hairline flex items-center gap-2 rounded-card border-line-strong bg-surface p-3.5">
        <Clock aria-hidden="true" className="size-(--icon-md) shrink-0 text-primary" />
        <span aria-live="polite" className="flex flex-col">
          <span className="font-bold text-ink">{formatDateTime(now.toISOString())}</span>
          <span className="text-sm text-ink-muted">{describeOffset(offsetMs)}</span>
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => advance(HOURS)}>
          +1 hora
        </Button>
        <Button variant="secondary" onClick={() => advance(DAYS)}>
          +1 dia
        </Button>
        <Button variant="secondary" onClick={() => advance(3 * DAYS)}>
          +3 dias
        </Button>
      </div>
      <Button variant="ghost" icon={RotateCcw} disabled={offsetMs === 0} onClick={reset}>
        Voltar ao horário real
      </Button>
    </div>
  )
}
