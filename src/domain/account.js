import { getNeighborhood } from './places.js'

/**
 * Tipos de conta: morador (CPF), comércio (CNPJ) e administração.
 * "cpf" e "cnpj" descrevem o TIPO da conta; o número do documento nunca é guardado.
 */
export const ACCOUNT_TYPES = {
  cpf: { label: 'Morador(a)', description: 'Conta de pessoa física (CPF).' },
  cnpj: { label: 'Comércio local', description: 'Conta de empresa (CNPJ).' },
  admin: { label: 'Administração', description: 'Equipe que modera o app.' },
}

const PERMISSIONS = {
  report: ['cpf'],
  support: ['cpf'],
  save_event: ['cpf', 'cnpj'],
  publish_commercial: ['cnpj'],
  access_admin: ['admin'],
}

/** O que cada tipo de conta pode fazer. Novas ações entram aqui quando uma etapa precisar. */
export function can(account, action) {
  return Boolean(account && PERMISSIONS[action]?.includes(account.type))
}

export const isResident = (account) => account?.type === 'cpf' || account?.type === 'cnpj'

export const AUTHOR_DISPLAY = {
  neighborhood: {
    label: 'Só o bairro',
    example: 'Morador(a) de Pinheiros',
  },
  first_name: {
    label: 'Primeiro nome e bairro',
    example: 'Ana · Pinheiros',
  },
}

export const DEFAULT_PRIVACY = { authorDisplay: 'neighborhood' }

/**
 * Como a pessoa aparece nos relatos (D18). O padrão é anônimo por bairro.
 * Contas de comércio aparecem sempre com o nome fantasia: publicidade precisa
 * dizer quem anuncia. As permissões são simuladas no protótipo.
 */
export function getAuthorLabel(account) {
  if (!account) return 'Morador(a)'
  if (account.type === 'cnpj') return account.businessName || 'Comércio local'

  const place = getNeighborhood(account.neighborhoodId)
  const neighborhood = place?.name ?? 'sua região'
  if (account.privacy?.authorDisplay === 'first_name') {
    const first = account.name?.trim().split(/\s+/)[0]
    if (first) return `${first} · ${neighborhood}`
  }
  return `Morador(a) de ${neighborhood}`
}

/** Iniciais para o avatar (máx. 2 letras). */
export function getInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
