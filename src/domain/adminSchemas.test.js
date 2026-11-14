import { describe, expect, it } from 'vitest'
import { makeStatusUpdateSchema, noticeSchema } from './adminSchemas.js'
import { nextStatusOptions } from './reportStatus.js'

describe('nextStatusOptions', () => {
  it('só avança: a partir de "Em análise" não volta para "Recebida"', () => {
    expect(nextStatusOptions('in_review').map((s) => s.id)).toEqual([
      'forwarded',
      'in_progress',
      'resolved',
      'not_applicable',
    ])
  })

  it('de "Recebida" pode ir a qualquer etapa seguinte, inclusive pulando', () => {
    expect(nextStatusOptions('received').map((s) => s.id)).toEqual([
      'in_review',
      'forwarded',
      'in_progress',
      'resolved',
      'not_applicable',
    ])
  })

  it('relato encerrado não tem destinos', () => {
    expect(nextStatusOptions('resolved')).toEqual([])
    expect(nextStatusOptions('not_applicable')).toEqual([])
  })
})

describe('makeStatusUpdateSchema', () => {
  const schema = makeStatusUpdateSchema('in_review')

  it('aceita avanço com nota opcional', () => {
    expect(schema.safeParse({ status: 'in_progress', note: '' }).success).toBe(true)
  })

  it('recusa voltar ou ficar na mesma etapa', () => {
    expect(schema.safeParse({ status: 'received', note: '' }).success).toBe(false)
    expect(schema.safeParse({ status: 'in_review', note: '' }).success).toBe(false)
  })

  it('exige justificativa em "Não procedente" e "Encaminhamento registrado"', () => {
    for (const status of ['not_applicable', 'forwarded']) {
      const result = schema.safeParse({ status, note: 'curta' })
      expect(result.success).toBe(false)
      expect(result.error.issues[0].path).toEqual(['note'])
      expect(
        schema.safeParse({ status, note: 'Justificativa com texto suficiente.' }).success,
      ).toBe(true)
    }
  })

  it('limita o tamanho da nota', () => {
    expect(schema.safeParse({ status: 'resolved', note: 'a'.repeat(281) }).success).toBe(
      false,
    )
    expect(schema.safeParse({ status: 'resolved', note: 'a'.repeat(280) }).success).toBe(
      true,
    )
  })

  it('relato encerrado não aceita nenhum destino', () => {
    expect(
      makeStatusUpdateSchema('resolved').safeParse({ status: 'in_progress', note: '' })
        .success,
    ).toBe(false)
  })
})

describe('noticeSchema', () => {
  const base = {
    level: 'attention',
    title: 'Obra na via principal',
    description: 'Haverá interdição parcial durante a madrugada.',
    scope: 'neighborhood',
    cityId: '',
    neighborhoodId: 'sao-paulo/pinheiros',
  }

  it('aceita aviso de bairro', () => {
    expect(noticeSchema.safeParse(base).success).toBe(true)
  })

  it('aceita aviso de município inteiro', () => {
    expect(
      noticeSchema.safeParse({
        ...base,
        scope: 'city',
        cityId: 'campinas',
        neighborhoodId: '',
      }).success,
    ).toBe(true)
  })

  it('exige o lugar conforme o alcance', () => {
    const noNeighborhood = noticeSchema.safeParse({ ...base, neighborhoodId: '' })
    expect(noNeighborhood.error.issues[0].path).toEqual(['neighborhoodId'])
    const noCity = noticeSchema.safeParse({ ...base, scope: 'city', cityId: 'atlantida' })
    expect(noCity.error.issues[0].path).toEqual(['cityId'])
  })

  it('valida nível, título e descrição', () => {
    expect(noticeSchema.safeParse({ ...base, level: 'x' }).success).toBe(false)
    expect(noticeSchema.safeParse({ ...base, title: 'abc' }).success).toBe(false)
    expect(noticeSchema.safeParse({ ...base, description: 'curta' }).success).toBe(false)
  })
})
