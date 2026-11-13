import { getCity } from './places.js'

/**
 * Gera um arquivo de calendário (.ics, RFC 5545) para um evento, para a pessoa
 * adicioná-lo à agenda do celular. Tudo é feito aqui, sem servidor.
 *
 * Cuidados do formato: quebras de linha CRLF, texto escapado (\ ; , e quebras),
 * linhas dobradas em 75 bytes e datas em UTC (o app do calendário converte).
 */

const CRLF = '\r\n'
const encoder = new TextEncoder()

export function escapeIcsText(text) {
  return String(text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/** Dobra uma linha longa: cada linha tem no máximo 75 bytes; as seguintes começam com espaço. */
export function foldLine(line) {
  const parts = []
  let current = ''
  let bytes = 0
  let limit = 75
  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > limit) {
      parts.push(current)
      current = char
      bytes = size
      limit = 74 // o espaço inicial da continuação já ocupa 1 byte
    } else {
      current += char
      bytes += size
    }
  }
  parts.push(current)
  return parts.join(CRLF + ' ')
}

const toUtc = (iso) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

/**
 * @param {object} event  item do feed estadual com kind "event"
 * @param {Date} now      usado só no DTSTAMP (carimbo de criação do arquivo)
 */
export function buildIcs(event, now) {
  const city = event.cityId ? getCity(event.cityId)?.name : null
  const location = [event.venue, city].filter(Boolean).join(', ')
  // O evento vai para a agenda real da pessoa: o aviso de que é fictício vai junto.
  const description = [
    event.summary,
    '',
    `Organização: ${event.source.name}.`,
    'Evento fictício criado para a demonstração do protótipo Nossa Rua.',
  ].join('\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nossa Rua//Prototipo//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@nossa-rua.demo`,
    `DTSTAMP:${toUtc(now.toISOString())}`,
    `DTSTART:${toUtc(event.startsAt)}`,
    `DTEND:${toUtc(event.endsAt)}`,
    `SUMMARY:${escapeIcsText(`[Demonstração] ${event.title}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join(CRLF) + CRLF
}

/** Nome de arquivo seguro: "oficina-de-pintura.ics". */
export function icsFilename(event) {
  const base = event.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  return `${base || 'evento'}.ics`
}
