import { useId } from 'react'
import {
  Bookmark,
  CalendarDays,
  Clock,
  Info,
  MapPin,
  Newspaper,
  OctagonAlert,
  Ticket,
  TriangleAlert,
} from 'lucide-react'
import { Badge } from './Badge.jsx'
import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'
import { SimulatedBadge } from './SimulatedBadge.jsx'
import { SourceBadge } from './SourceBadge.jsx'

const LEVELS = {
  info: { label: 'Informativo', icon: Info, tone: 'info', strip: 'border-l-primary' },
  attention: {
    label: 'Atenção',
    icon: TriangleAlert,
    tone: 'warn',
    strip: 'border-l-warn',
  },
  urgent: {
    label: 'Urgente',
    icon: OctagonAlert,
    tone: 'danger',
    strip: 'border-l-danger',
  },
}

const TIMING = {
  upcoming: null,
  ongoing: { label: 'Acontecendo agora', tone: 'ok' },
  past: { label: 'Já aconteceu', tone: 'neutral' },
}

/**
 * Cartão do feed estadual. Os três tipos se distinguem pela FORMA:
 *
 *  - alert: faixa lateral grossa, nível de gravidade e validade. Alerta urgente
 *    ganha fundo de destaque; alerta encerrado perde a faixa colorida e diz "Encerrado".
 *  - news: cartão liso, com ícone de jornal e a fonte.
 *  - event: bloco de data/local/preço em destaque e botão de salvar.
 *
 * Só apresentação: de onde vêm os dados e o que cada botão faz é de quem usa.
 */
export function StateCard({
  kind,
  title,
  summary,
  body, // parágrafos (só no detalhe de notícias)
  sourceName,
  place, // "Campinas" ou "Todo o estado"
  timeLabel, // "há 3 h"
  detail = false,
  onOpen,
  // alerta
  level = 'info',
  ended = false,
  validityLabel,
  // evento
  when,
  venue,
  price = null, // null = gratuito
  timing = 'upcoming',
  saved = false,
  onToggleSave,
  savePending = false,
  children, // ações extras (no detalhe: agenda e compartilhar)
}) {
  const titleId = useId()
  const Title = detail ? 'h1' : 'h3'
  const alert = LEVELS[level]
  const timingBadge = TIMING[timing]

  const shell = {
    alert: ended
      ? 'hairline border-line border-l-8 border-l-line-strong bg-surface'
      : `hairline border-line border-l-8 ${alert.strip} ${level === 'urgent' ? 'bg-danger-soft' : 'bg-surface'}`,
    news: 'hairline border-line bg-surface',
    event: 'hairline border-line bg-surface',
  }[kind]

  return (
    <article
      aria-labelledby={titleId}
      className={`overflow-hidden rounded-card ${shell}`}
    >
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge kind="demo_institution" />
          {kind === 'alert' && (
            <>
              <Badge tone={alert.tone} icon={alert.icon}>
                {alert.label}
              </Badge>
              {ended && (
                <Badge tone="neutral" icon={Clock}>
                  Encerrado
                </Badge>
              )}
            </>
          )}
          {kind === 'news' && (
            <Badge tone="neutral" icon={Newspaper}>
              Notícia
            </Badge>
          )}
          {kind === 'event' && (
            <>
              <Badge tone="info" icon={CalendarDays}>
                Evento
              </Badge>
              {timingBadge && <Badge tone={timingBadge.tone}>{timingBadge.label}</Badge>}
            </>
          )}
          <SimulatedBadge />
        </div>

        <Title
          id={titleId}
          className="font-display text-lg leading-snug font-bold text-ink"
        >
          {title}
        </Title>

        {kind === 'event' && (
          <dl className="flex flex-col gap-1.5 text-ink">
            <div className="flex items-start gap-2">
              <dt className="sr-only">Quando</dt>
              <Icon icon={CalendarDays} className="mt-0.5" />
              <dd className="font-bold">{when}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="sr-only">Onde</dt>
              <Icon icon={MapPin} className="mt-0.5" />
              <dd>
                {venue} · {place}
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="sr-only">Entrada</dt>
              <Icon icon={Ticket} className="mt-0.5" />
              <dd>{price ? `R$ ${price}` : 'Entrada gratuita'}</dd>
            </div>
          </dl>
        )}

        {detail && body ? (
          <div className="flex flex-col gap-3 text-ink">
            <p className="font-bold">{summary}</p>
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className={`text-ink ${detail ? '' : 'line-clamp-3'}`}>{summary}</p>
        )}

        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-ink-muted">
          <span>{sourceName}</span>
          {kind !== 'event' && (
            <>
              <span aria-hidden="true">·</span>
              <Icon icon={MapPin} size="sm" />
              <span>{place}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{timeLabel}</span>
        </p>
        {kind === 'alert' && (
          <p className="text-sm font-bold text-ink">{validityLabel}</p>
        )}

        {(!detail || kind === 'event' || children) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {kind === 'event' && onToggleSave && (
              <Button
                variant={saved ? 'primary' : 'secondary'}
                icon={Bookmark}
                aria-pressed={saved}
                aria-describedby={titleId}
                disabled={savePending}
                onClick={onToggleSave}
              >
                {saved ? 'Salvo' : 'Salvar'}
              </Button>
            )}
            {!detail && (
              <Button variant="ghost" aria-describedby={titleId} onClick={onOpen}>
                Ver detalhes
              </Button>
            )}
            {children}
          </div>
        )}
      </div>
    </article>
  )
}
