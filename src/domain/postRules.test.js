import { describe, expect, it } from 'vitest'
import { MAX_COMMERCIAL_PER_WEEK, checkCommercialLimits } from './commercialLimits.js'
import { commercialSchema, reportSchema } from './postSchemas.js'
import { REPORT_CATEGORIES, getCategory } from './reportCategories.js'
import { findSimilarReports, similarityScore, tokenize } from './similarity.js'

const NOW = new Date('2026-11-10T12:00:00-03:00')
const DAY = 86_400_000
const ago = (days) => new Date(NOW.getTime() - days * DAY).toISOString()

describe('foto obrigatória por categoria (D9)', () => {
  it('exige foto onde ajuda a comprovar; é opcional onde não ajuda', () => {
    const required = REPORT_CATEGORIES.filter((c) => c.photoRequired).map((c) => c.id)
    expect(required.sort()).toEqual(['cleaning', 'road', 'sidewalk', 'tree'])
    expect(getCategory('lighting').photoRequired).toBe(false)
    expect(getCategory('flooding').photoRequired).toBe(false)
  })

  const base = {
    category: 'road',
    neighborhoodId: 'sao-paulo/pinheiros',
    title: 'Buraco grande',
    description: 'Buraco enorme na via principal, perto da praça.',
    photo: null,
  }

  it('o schema pede a foto só nas categorias que exigem', () => {
    const bad = reportSchema.safeParse(base)
    expect(bad.success).toBe(false)
    expect(bad.error.issues[0].path).toEqual(['photo'])
    expect(reportSchema.safeParse({ ...base, photo: new Blob(['x']) }).success).toBe(true)
    expect(reportSchema.safeParse({ ...base, category: 'lighting' }).success).toBe(true)
  })

  it('valida título, descrição, categoria e bairro', () => {
    const r = reportSchema.safeParse({
      ...base,
      category: '',
      neighborhoodId: '',
      title: 'abc',
      description: 'curta',
      photo: new Blob(['x']),
    })
    expect(r.success).toBe(false)
    const paths = r.error.issues.map((i) => i.path[0])
    expect(paths).toEqual(
      expect.arrayContaining(['category', 'neighborhoodId', 'title', 'description']),
    )
    expect(commercialSchema.safeParse({ ...base, photo: undefined }).success).toBe(true)
  })
})

describe('semelhança de relatos', () => {
  it('ignora acentos, maiúsculas e palavras comuns', () => {
    expect([...tokenize('O Buraco na RUA está Gigante!')].sort()).toEqual(
      ['buraco', 'esta', 'gigante'].filter((w) => w !== 'esta'),
    )
    expect(tokenize('de da do na')).toEqual(new Set())
  })

  it('pontua pelo quanto do rascunho aparece no candidato', () => {
    expect(
      similarityScore('buraco grande avenida', 'Buraco grande na via principal'),
    ).toEqual({
      shared: 2,
      score: 2 / 3,
    })
    expect(similarityScore('', 'qualquer coisa').score).toBe(0)
  })

  const mk = (over) => ({
    type: 'report',
    neighborhoodId: 'sao-paulo/pinheiros',
    category: 'road',
    status: 'received',
    createdAt: ago(3),
    title: 'Buraco grande na via principal',
    description: 'O buraco aumenta a cada chuva e os carros desviam.',
    ...over,
  })
  const draft = {
    neighborhoodId: 'sao-paulo/pinheiros',
    category: 'road',
    title: 'Buraco grande',
    description: 'carros desviam do buraco',
  }

  it('encontra o relato aberto, da mesma categoria e bairro', () => {
    expect(findSimilarReports(draft, [mk({ id: 'a' })], NOW).map((p) => p.id)).toEqual([
      'a',
    ])
  })

  it('descarta outro bairro, outra categoria, resolvido, não procedente, antigo e não-relato', () => {
    const others = [
      mk({ neighborhoodId: 'santos/gonzaga' }),
      mk({ category: 'tree' }),
      mk({ status: 'resolved' }),
      mk({ status: 'not_applicable' }),
      mk({ createdAt: ago(31) }),
      mk({ type: 'notice' }),
    ]
    expect(findSimilarReports(draft, others, NOW)).toEqual([])
  })

  it('relatos em andamento ou em análise ainda contam', () => {
    for (const status of ['in_review', 'forwarded', 'in_progress']) {
      expect(findSimilarReports(draft, [mk({ status })], NOW)).toHaveLength(1)
    }
  })

  it('exige pelo menos 2 palavras em comum e metade do rascunho', () => {
    const weak = { ...draft, title: 'Buraco', description: '' }
    expect(findSimilarReports(weak, [mk({})], NOW)).toEqual([]) // só 1 palavra
    const different = {
      ...draft,
      title: 'Calçada quebrada',
      description: 'raízes levantaram',
    }
    expect(findSimilarReports(different, [mk({})], NOW)).toEqual([])
  })

  it('ordena do mais parecido e limita a quantidade', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      mk({ id: `p${i}`, description: 'O buraco aumenta a cada chuva.' }),
    )
    const better = mk({
      id: 'melhor',
      title: 'Buraco grande',
      description: 'carros desviam do buraco',
    })
    const result = findSimilarReports(draft, [...many, better], NOW)
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('melhor')
  })
})

describe('limites de publicação comercial', () => {
  const account = { type: 'cnpj', neighborhoodId: 'sao-paulo/vila-mariana' }
  const own = (daysAgo) => ({ type: 'commercial', createdAt: ago(daysAgo) })
  const check = (over) =>
    checkCommercialLimits({
      account,
      neighborhoodId: 'sao-paulo/pinheiros',
      existing: [],
      now: NOW,
      ...over,
    })

  it('libera dentro do município e abaixo do limite semanal', () => {
    expect(check({}).ok).toBe(true)
    expect(check({ existing: [own(1)] }).ok).toBe(true)
  })

  it('bloqueia o terceiro anúncio da semana e diz quando libera', () => {
    const r = check({ existing: [own(1), own(5)] })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(new RegExp(`${MAX_COMMERCIAL_PER_WEEK} anúncios`))
    expect(r.error).toMatch(/em 2 dias/)
  })

  it('anúncios com mais de 7 dias não contam', () => {
    expect(check({ existing: [own(8), own(9), own(10)] }).ok).toBe(true)
  })

  it('bloqueia bairro de outro município', () => {
    const r = check({ neighborhoodId: 'santos/gonzaga' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/São Paulo/)
  })

  it('bairro desconhecido é recusado', () => {
    expect(check({ neighborhoodId: 'x/y' }).ok).toBe(false)
  })
})
