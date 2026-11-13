import { useId } from 'react'
import { HandHeart, Info, MapPin, OctagonAlert, Store, TriangleAlert } from 'lucide-react'
import { Badge } from './Badge.jsx'
import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'
import { SimulatedBadge } from './SimulatedBadge.jsx'
import { SourceBadge } from './SourceBadge.jsx'
import { StatusBadge } from './StatusBadge.jsx'

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

/**
 * Cartão de publicação. Os três tipos se distinguem pela FORMA, não só pela cor:
 *
 *  - report (relato de morador): cartão branco liso, selo "Relato de morador",
 *    status e botão de apoio.
 *  - notice (aviso): faixa lateral grossa, selo de origem e nível de importância.
 *    Nível "Urgente" ganha fundo de destaque.
 *  - commercial: fundo quente, borda tracejada e selo "Publicidade".
 *
 * É só apresentação: quem usa decide de onde vêm os dados e o que cada botão faz.
 */
export function PostCard({
  type,
  title,
  description,
  location,
  timeLabel,
  image,
  imageKind = 'photo', // 'photo' | 'illustration'
  simulated = false,
  // relato
  status,
  supports = 0,
  supported = false,
  onToggleSupport,
  supportPending = false,
  ownPost = false, // relato do próprio morador: ele não se apoia
  onOpen,
  detail = false, // na tela de detalhe: texto completo, título como h1, sem botões de abrir
  // aviso
  level = 'info',
  source = 'moderation',
  // comercial
  businessName,
}) {
  const titleId = useId()
  const notice = LEVELS[level]
  const Title = detail ? 'h1' : 'h3'

  const shell = {
    report: 'hairline border-line bg-surface',
    notice: `hairline border-line border-l-8 ${notice.strip} ${level === 'urgent' ? 'bg-danger-soft' : 'bg-surface'}`,
    commercial: 'hairline border-dashed border-line-strong bg-surface-warm',
  }[type]

  return (
    <article
      aria-labelledby={titleId}
      className={`overflow-hidden rounded-card ${shell}`}
    >
      {image && (
        <div className="relative aspect-video w-full bg-primary-soft">
          {image}
          {imageKind === 'illustration' && (
            <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-xs font-bold text-canvas">
              Ilustração
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {type === 'report' && <SourceBadge kind="resident" />}
          {type === 'notice' && (
            <>
              <SourceBadge kind={source} />
              <Badge tone={notice.tone} icon={notice.icon}>
                {notice.label}
              </Badge>
            </>
          )}
          {type === 'commercial' && (
            <Badge tone="neutral" icon={Store}>
              Publicidade
            </Badge>
          )}
          {simulated && <SimulatedBadge />}
        </div>

        <Title
          id={titleId}
          className="font-display text-lg leading-snug font-bold text-ink"
        >
          {title}
        </Title>
        {type === 'commercial' && businessName && (
          <p className="text-sm font-bold text-ink-muted">{businessName}</p>
        )}
        <p className={`text-ink ${detail ? '' : 'line-clamp-3'}`}>{description}</p>

        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <Icon icon={MapPin} size="sm" />
          <span>{location}</span>
          <span aria-hidden="true">·</span>
          <span>{timeLabel}</span>
        </p>

        {type === 'report' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <StatusBadge status={status} />
            <div className="flex gap-2">
              {!detail && (
                <Button variant="ghost" onClick={onOpen}>
                  Acompanhar
                </Button>
              )}
              {ownPost ? (
                <Badge tone="info">Seu relato · {supports} apoios</Badge>
              ) : (
                <Button
                  variant={supported ? 'primary' : 'secondary'}
                  icon={HandHeart}
                  aria-pressed={supported}
                  disabled={supportPending}
                  onClick={onToggleSupport}
                >
                  {supported ? 'Apoiado' : 'Apoiar'} · {supports}
                </Button>
              )}
            </div>
          </div>
        )}
        {type === 'commercial' && !detail && (
          <div className="pt-1">
            <Button variant="secondary" onClick={onOpen}>
              Ver detalhes
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
