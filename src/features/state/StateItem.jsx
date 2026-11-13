import { StateCard } from '../../components/ui/StateCard.jsx'
import { getCity } from '../../domain/places.js'
import { formatRelative } from '../../domain/relativeTime.js'
import { alertState, eventTiming } from '../../domain/stateFeed.js'
import { formatDateTime, formatEventWhen } from '../../utils/format.js'

/** Traduz um item do feed estadual (dados do serviço) para o StateCard (apresentação). */
export function StateItem({
  item,
  now,
  onOpen,
  onToggleSave,
  savePending,
  detail,
  children,
}) {
  const place = item.cityId ? (getCity(item.cityId)?.name ?? '') : 'Todo o estado'
  const common = {
    kind: item.kind,
    title: item.title,
    summary: item.summary,
    sourceName: item.source.name,
    place,
    timeLabel: formatRelative(item.publishedAt, now),
    detail,
    onOpen,
    children,
  }

  if (item.kind === 'alert') {
    const ended = alertState(item, now) === 'expired'
    return (
      <StateCard
        {...common}
        level={item.level}
        ended={ended}
        validityLabel={`${ended ? 'Encerrado em' : 'Vale até'} ${formatDateTime(item.expiresAt)}`}
      />
    )
  }
  if (item.kind === 'news') {
    return <StateCard {...common} body={item.body} />
  }
  return (
    <StateCard
      {...common}
      when={formatEventWhen(item.startsAt, item.endsAt)}
      venue={item.venue}
      price={item.price}
      timing={eventTiming(item, now)}
      saved={item.saved}
      onToggleSave={onToggleSave}
      savePending={savePending}
    />
  )
}
