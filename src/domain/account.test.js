import { describe, expect, it } from 'vitest'
import { can, getAuthorLabel, getInitials, isResident } from './account.js'
import { loginSchema, profileSchema, signupSchema } from './accountSchemas.js'

const resident = {
  type: 'cpf',
  name: 'Ana Souza Lima',
  neighborhoodId: 'sao-paulo/pinheiros',
  privacy: { authorDisplay: 'neighborhood' },
}

describe('permissões por tipo de conta', () => {
  it('cada tipo só faz o que lhe cabe', () => {
    expect(can(resident, 'report')).toBe(true)
    expect(can(resident, 'publish_commercial')).toBe(false)
    expect(can({ type: 'cnpj' }, 'publish_commercial')).toBe(true)
    expect(can({ type: 'cnpj' }, 'report')).toBe(false)
    expect(can({ type: 'admin' }, 'access_admin')).toBe(true)
    expect(can(resident, 'access_admin')).toBe(false)
  })

  it('sem conta ou com ação desconhecida, nega', () => {
    expect(can(null, 'report')).toBe(false)
    expect(can(resident, 'inventada')).toBe(false)
  })

  it('isResident cobre CPF e CNPJ, não admin', () => {
    expect(isResident({ type: 'cpf' })).toBe(true)
    expect(isResident({ type: 'cnpj' })).toBe(true)
    expect(isResident({ type: 'admin' })).toBe(false)
    expect(isResident(null)).toBe(false)
  })
})

describe('getAuthorLabel (D18)', () => {
  it('por padrão mostra só o bairro', () => {
    expect(getAuthorLabel(resident)).toBe('Morador(a) de Pinheiros')
  })

  it('com a opção "primeiro nome e bairro", mostra os dois', () => {
    const account = { ...resident, privacy: { authorDisplay: 'first_name' } }
    expect(getAuthorLabel(account)).toBe('Ana · Pinheiros')
  })

  it('comércio aparece sempre com o nome fantasia', () => {
    expect(getAuthorLabel({ type: 'cnpj', businessName: 'Padaria Exemplo' })).toBe(
      'Padaria Exemplo',
    )
  })

  it('não quebra sem bairro ou sem conta', () => {
    expect(getAuthorLabel({ type: 'cpf', neighborhoodId: 'x' })).toBe(
      'Morador(a) de sua região',
    )
    expect(getAuthorLabel(null)).toBe('Morador(a)')
  })
})

describe('getInitials', () => {
  it('usa a primeira e a última inicial', () => {
    expect(getInitials('Ana Souza Lima')).toBe('AL')
    expect(getInitials('ana')).toBe('A')
    expect(getInitials('  ')).toBe('?')
  })
})

describe('schemas de formulário', () => {
  const valid = {
    type: 'cpf',
    name: 'Ana Souza',
    businessName: '',
    email: 'ana@exemplo.com',
    document: '529.982.247-25',
    neighborhoodId: 'sao-paulo/pinheiros',
    acceptedTerms: true,
  }
  const messages = (result) => result.error.issues.map((i) => i.message)

  it('aceita um cadastro de morador válido', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true)
  })

  it('recusa CPF inválido, bairro desconhecido e falta de aceite', () => {
    const result = signupSchema.safeParse({
      ...valid,
      document: '111.111.111-11',
      neighborhoodId: '',
      acceptedTerms: false,
    })
    expect(result.success).toBe(false)
    const paths = result.error.issues.map((i) => i.path[0])
    expect(paths).toEqual(
      expect.arrayContaining(['document', 'neighborhoodId', 'acceptedTerms']),
    )
  })

  it('conta de comércio exige CNPJ válido e nome do comércio', () => {
    const company = { ...valid, type: 'cnpj', document: '11.222.333/0001-81' }
    const result = signupSchema.safeParse(company)
    expect(result.success).toBe(false)
    expect(messages(result)).toContain('Informe o nome do comércio.')
    expect(
      signupSchema.safeParse({ ...company, businessName: 'Padaria Exemplo' }).success,
    ).toBe(true)
    // um CPF válido não serve como CNPJ
    expect(
      signupSchema.safeParse({ ...company, businessName: 'X Y', document: '52998224725' })
        .success,
    ).toBe(false)
  })

  it('e-mail e login validam formato', () => {
    expect(loginSchema.safeParse({ email: 'sem-arroba' }).success).toBe(false)
    expect(loginSchema.safeParse({ email: ' ana@exemplo.com ' }).success).toBe(true)
    expect(loginSchema.safeParse({ email: '' }).success).toBe(false)
  })

  it('perfil exige nome com pelo menos 2 letras', () => {
    expect(profileSchema.safeParse({ name: 'A', businessName: '' }).success).toBe(false)
    expect(profileSchema.safeParse({ name: 'Ana', businessName: '' }).success).toBe(true)
  })
})
