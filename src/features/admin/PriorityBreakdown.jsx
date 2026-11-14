import { MAX_BONUS, SUPPORT_FULL, URGENCY_LEVELS } from '../../domain/priority.js'
import { formatDuration } from '../../domain/relativeTime.js'

function Bar({ value }) {
  return (
    <span aria-hidden="true" className="block h-2 w-full rounded-full bg-line">
      <span
        className="block h-2 rounded-full bg-primary"
        style={{ width: `${value}%` }}
      />
    </span>
  )
}

function Index({ label, value, detail }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-baseline justify-between gap-2 font-bold text-ink">
        {label}
        <span className="font-display text-lg">{value}</span>
      </dt>
      <dd className="flex flex-col gap-1.5 text-sm text-ink-muted">
        <Bar value={value} />
        {detail}
      </dd>
    </div>
  )
}

/** Mostra a conta da prioridade, para a administração (e quem auditar) entender por que o relato está onde está. */
export function PriorityBreakdown({ priority }) {
  const level = URGENCY_LEVELS[priority.level]
  const capped = priority.rawBonus > priority.bonus
  return (
    <section
      aria-labelledby="priority-title"
      className="hairline flex flex-col gap-4 rounded-card border-line bg-surface p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="priority-title" className="font-display text-lg font-bold">
          Prioridade
        </h2>
        <p className="font-display text-2xl font-bold text-primary">
          {priority.score}
          <span className="ml-1 text-sm font-bold text-ink-muted">pontos</span>
        </p>
      </div>

      <dl className="flex flex-col gap-4">
        <Index
          label={`Urgência (${level.label.toLowerCase()})`}
          value={priority.urgencyIndex}
          detail="Vem da categoria do relato e define o nível. O nível sempre vem primeiro na fila."
        />
        <Index
          label="Espera"
          value={priority.waitingIndex}
          detail={`${priority.closed ? 'Levou' : 'Aguardando há'} ${formatDuration(priority.waitedHours)}; prazo de referência de ${formatDuration(priority.slaHours)}.`}
        />
        <Index
          label="Apoio da comunidade"
          value={priority.supportIndex}
          detail={`${SUPPORT_FULL} apoios chegam ao máximo.`}
        />
      </dl>

      <p className="rounded-control bg-surface-alt p-3 text-sm text-ink">
        <strong>
          Pontuação = urgência {priority.urgencyIndex} + bônus {priority.bonus}.
        </strong>{' '}
        O bônus é 15% da espera mais 10% do apoio
        {capped ? ` (daria ${priority.rawBonus}, mas é limitado a +${MAX_BONUS})` : ''};
        por isso espera e apoio só desempatam dentro do mesmo nível e nunca fazem um
        relato menos grave passar à frente de um mais grave.
      </p>
      <p className="text-xs text-ink-muted">
        Os prazos de referência (24 h, 72 h e 7 dias) são valores fictícios do protótipo.
      </p>
    </section>
  )
}
