import { describe, expect, it } from 'vitest'
import { buildIcs, escapeIcsText, foldLine, icsFilename } from './ics.js'

const NOW = new Date('2026-11-13T12:00:00Z')
const event = {
  kind: 'event',
  id: 'seed-state-e1',
  title: 'Feira de livros, trocas e leitura',
  summary: 'Traga um livro; leve outro.\nEntrada livre.',
  startsAt: '2026-11-14T13:00:00.000Z',
  endsAt: '2026-11-14T15:30:00.000Z',
  venue: 'Biblioteca do bairro',
  cityId: 'campinas',
  source: { name: 'Rede Cultural Fictícia' },
}

describe('escapeIcsText', () => {
  it('escapa barra, ponto e vírgula, vírgula e quebras de linha', () => {
    expect(escapeIcsText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne')
  })
})

describe('foldLine', () => {
  it('não mexe em linhas curtas', () => {
    expect(foldLine('SUMMARY:oi')).toBe('SUMMARY:oi')
  })

  it('dobra em 75 bytes, com espaço no início das continuações', () => {
    const folded = foldLine('X:' + 'a'.repeat(200))
    const lines = folded.split('\r\n')
    expect(lines.length).toBeGreaterThan(1)
    const encoder = new TextEncoder()
    for (const line of lines) expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
    for (const line of lines.slice(1)) expect(line.startsWith(' ')).toBe(true)
    // juntando de volta, o conteúdo é o mesmo
    expect(lines.map((l, i) => (i === 0 ? l : l.slice(1))).join('')).toBe(
      'X:' + 'a'.repeat(200),
    )
  })

  it('nunca corta um caractere acentuado no meio', () => {
    const text = 'X:' + 'ç'.repeat(100) // 2 bytes cada
    const lines = foldLine(text).split('\r\n')
    const rebuilt = lines.map((l, i) => (i === 0 ? l : l.slice(1))).join('')
    expect(rebuilt).toBe(text)
    for (const line of lines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
  })
})

describe('buildIcs', () => {
  const ics = buildIcs(event, NOW)

  it('tem a estrutura mínima de um calendário', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('VERSION:2.0')
  })

  it('usa CRLF em todas as quebras de linha', () => {
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('grava datas em UTC, no formato do calendário', () => {
    expect(ics).toContain('DTSTART:20261114T130000Z')
    expect(ics).toContain('DTEND:20261114T153000Z')
    expect(ics).toContain('DTSTAMP:20261113T120000Z')
  })

  it('tem UID estável por evento', () => {
    expect(ics).toContain('UID:seed-state-e1@nossa-rua.demo')
    expect(buildIcs(event, new Date('2027-01-01T00:00:00Z'))).toContain(
      'UID:seed-state-e1@nossa-rua.demo',
    )
  })

  it('marca como demonstração, no título e na descrição', () => {
    expect(ics).toContain('SUMMARY:[Demonstração] Feira de livros\\, trocas e leitura')
    // a descrição pode ser dobrada: desfaz a dobra antes de procurar
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('Evento fictício criado para a demonstração')
    expect(unfolded).toContain('Traga um livro\\; leve outro.\\nEntrada livre.')
  })

  it('inclui local com o município', () => {
    expect(ics.replace(/\r\n /g, '')).toContain(
      'LOCATION:Biblioteca do bairro\\, Campinas',
    )
  })

  it('omite LOCATION quando não há local', () => {
    const without = buildIcs({ ...event, venue: undefined, cityId: null }, NOW)
    expect(without).not.toContain('LOCATION')
  })
})

describe('icsFilename', () => {
  it('gera nome simples, sem acento nem símbolos', () => {
    expect(icsFilename(event)).toBe('feira-de-livros-trocas-e-leitura.ics')
  })

  it('tem nome padrão quando o título não rende letras', () => {
    expect(icsFilename({ title: '???' })).toBe('evento.ics')
  })
})
