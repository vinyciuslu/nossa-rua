import { describe, expect, it } from 'vitest'
import {
  NOT_APPLICABLE_STATUS,
  REPORT_STATUSES,
  getStatus,
  isClosedStatus,
  statusStep,
} from './reportStatus.js'

describe('reportStatus', () => {
  it('começa em "Recebida" e termina em "Resolvida"', () => {
    expect(REPORT_STATUSES[0].label).toBe('Recebida')
    expect(REPORT_STATUSES.at(-1).label).toBe('Resolvida')
  })

  it('usa o rótulo neutro "Em andamento" e "Encaminhamento registrado"', () => {
    const labels = REPORT_STATUSES.map((s) => s.label)
    expect(labels).toContain('Em andamento')
    expect(labels).toContain('Encaminhamento registrado')
    expect(labels).not.toContain('Em atendimento')
  })

  it('getStatus encontra por id e rejeita ids desconhecidos', () => {
    expect(getStatus('in_review').label).toBe('Em análise')
    expect(getStatus(NOT_APPLICABLE_STATUS.id).label).toBe('Não procedente')
    expect(() => getStatus('xyz')).toThrow()
  })

  it('só "Resolvida" e "Não procedente" encerram o ciclo', () => {
    expect(isClosedStatus('resolved')).toBe(true)
    expect(isClosedStatus('not_applicable')).toBe(true)
    expect(isClosedStatus('in_progress')).toBe(false)
  })

  it('statusStep devolve a posição no ciclo principal', () => {
    expect(statusStep('received')).toBe(0)
    expect(statusStep('resolved')).toBe(4)
    expect(statusStep('not_applicable')).toBe(-1)
  })
})
