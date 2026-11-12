import { Check, Circle, CircleX, Minus } from 'lucide-react'
import {
  NOT_APPLICABLE_STATUS,
  REPORT_STATUSES,
  statusStep,
} from '../../domain/reportStatus.js'
import { formatDateTime } from '../../utils/format.js'
import { Icon } from './Icon.jsx'
import { SimulatedBadge } from './SimulatedBadge.jsx'

const ACTORS = {
  author: 'Publicado pelo morador',
  moderation: 'Atualização da moderação da plataforma',
}

/**
 * Acompanhamento do ciclo completo de um relato, da publicação à resolução.
 *
 * Princípios de transparência:
 *  1. Mostra TODAS as etapas do ciclo, inclusive as que ainda não aconteceram.
 *  2. Cada etapa registrada diz quem a fez e quando.
 *  3. Cada atualização simulada é marcada como "Simulado".
 *  4. Etapas puladas aparecem como "Não registrada", e não somem.
 *  5. Um aviso fixo lembra que nada aqui é ação de órgão público.
 *
 * `events`: [{ status, at (ISO), by: 'author' | 'moderation', note?, simulated? }]
 * em ordem cronológica. O status atual é o do último evento.
 */
export function StatusTimeline({ events }) {
  const last = events.at(-1)
  const closedAsNotApplicable = last?.status === NOT_APPLICABLE_STATUS.id
  const currentStep = closedAsNotApplicable ? -1 : statusStep(last.status)

  const steps = REPORT_STATUSES.map((status, index) => ({
    status,
    event: events.find((e) => e.status === status.id),
    state: index === currentStep ? 'current' : index < currentStep ? 'past' : 'future',
  })).filter((step) => !(closedAsNotApplicable && !step.event))

  if (closedAsNotApplicable) {
    steps.push({ status: NOT_APPLICABLE_STATUS, event: last, state: 'current' })
  }

  return (
    <div>
      <ol className="flex flex-col">
        {steps.map(({ status, event, state }, index) => {
          const registered = Boolean(event)
          const isLast = index === steps.length - 1
          return (
            <li
              key={status.id}
              aria-current={state === 'current' ? 'step' : undefined}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute top-8 bottom-0 left-4 -ml-px w-0.5 ${
                    registered && state !== 'current' ? 'bg-primary' : 'bg-line-strong'
                  }`}
                />
              )}
              <Marker
                state={state}
                registered={registered}
                notApplicable={status.id === NOT_APPLICABLE_STATUS.id}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                <p
                  className={`font-display font-bold ${registered ? 'text-ink' : 'text-ink-muted'}`}
                >
                  {status.label}
                  {state === 'current' && (
                    <span className="ml-2 text-sm font-bold text-primary">
                      {' '}
                      · etapa atual
                    </span>
                  )}
                </p>
                {registered ? (
                  <>
                    <p className="text-sm text-ink-muted">
                      <time dateTime={event.at}>{formatDateTime(event.at)}</time> ·{' '}
                      {ACTORS[event.by]}
                    </p>
                    <p className="text-sm text-ink">{event.note ?? status.description}</p>
                    {event.simulated && (
                      <div>
                        <SimulatedBadge>Atualização simulada</SimulatedBadge>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-ink-muted">
                    {state === 'past'
                      ? 'Etapa não registrada neste relato.'
                      : 'Ainda não aconteceu.'}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-5 rounded-control bg-primary-soft p-3 text-sm text-primary-ink">
        Atualizações marcadas como <strong>simuladas</strong> fazem parte da demonstração
        do app e não indicam ação de nenhum órgão público. A moderação da plataforma não
        substitui os canais oficiais de atendimento.
      </p>
    </div>
  )
}

function Marker({ state, registered, notApplicable }) {
  const base =
    'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full'
  if (notApplicable) {
    return (
      <span className={`${base} bg-ink text-canvas`}>
        <Icon icon={CircleX} size="sm" />
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className={`${base} bg-primary text-on-primary ring-4 ring-primary-soft`}>
        <Icon icon={Circle} size="sm" className="fill-current" />
      </span>
    )
  }
  if (registered) {
    return (
      <span className={`${base} bg-primary text-on-primary`}>
        <Icon icon={Check} size="sm" />
      </span>
    )
  }
  return (
    <span
      className={`${base} hairline border-dashed border-line-strong bg-surface text-ink-muted`}
    >
      <Icon icon={Minus} size="sm" />
    </span>
  )
}
