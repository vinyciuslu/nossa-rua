import { DEFAULT_PRIVACY } from '../domain/account.js'
import { getNeighborhood } from '../domain/places.js'
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD } from '../config/demoAccounts.js'
import { createId } from '../utils/id.js'
import { wait } from './latency.js'
import { deleteAccountContent } from './postService.js'
import { ServiceError } from './ServiceError.js'
import { storage } from './storage.js'

/**
 * Contas e sessão (simuladas, no localStorage deste aparelho).
 *
 * É a única parte do app que sabe ONDE as contas ficam. As telas só chamam estas
 * funções assíncronas; quando houver backend, o conteúdo muda e a assinatura
 * continua igual.
 *
 * Privacidade (regra do projeto):
 *  - o CPF/CNPJ digitado nunca chega aqui: o formulário valida e descarta;
 *  - não existe senha de cidadão: no protótipo a conta é identificada pelo
 *    e-mail, e a tela diz isso com todas as letras;
 *  - cada conta tem um id interno.
 */

const ACCOUNTS_KEY = 'accounts'
const SESSION_KEY = 'session'

const normalizeEmail = (email) =>
  String(email ?? '')
    .trim()
    .toLowerCase()

const readAccounts = () => storage.read(ACCOUNTS_KEY, [])

function saveAccounts(accounts) {
  if (!storage.write(ACCOUNTS_KEY, accounts)) {
    throw new ServiceError(
      'storage_unavailable',
      'Não foi possível salvar neste aparelho. Verifique se o navegador permite armazenamento.',
    )
  }
}

function startSession(accountId) {
  storage.write(SESSION_KEY, { accountId })
}

/** Rótulo inicial: quem se cadastra já acompanha o próprio bairro. */
function initialFollowedPlaces(type, neighborhoodId) {
  if (!getNeighborhood(neighborhoodId)) return []
  return [{ neighborhoodId, label: type === 'cnpj' ? 'Trabalho' : 'Casa' }]
}

function buildAccount({
  id = createId('acc'),
  type,
  name,
  email,
  businessName = '',
  neighborhoodId,
  demo = false,
}) {
  return {
    id,
    type,
    name: name.trim(),
    email: normalizeEmail(email),
    businessName: businessName.trim(),
    neighborhoodId: neighborhoodId ?? null,
    followedPlaces: type === 'admin' ? [] : initialFollowedPlaces(type, neighborhoodId),
    privacy: { ...DEFAULT_PRIVACY },
    demo,
    createdAt: new Date().toISOString(),
  }
}

/** Cria a conta de demonstração na primeira vez que ela é usada. */
function ensureDemoAccount(kind) {
  const accounts = readAccounts()
  const found = accounts.find((a) => a.id === DEMO_ACCOUNTS[kind].id)
  if (found) return found
  const account = buildAccount({ ...DEMO_ACCOUNTS[kind], demo: true })
  saveAccounts([...accounts, account])
  return account
}

export async function getSession() {
  await wait(0)
  const session = storage.read(SESSION_KEY)
  if (!session) return null
  const account = readAccounts().find((a) => a.id === session.accountId)
  if (!account) {
    storage.remove(SESSION_KEY)
    return null
  }
  return account
}

/** `input`: { type: 'cpf' | 'cnpj', name, email, businessName, neighborhoodId }. */
export async function signUp(input) {
  await wait()
  const email = normalizeEmail(input.email)
  const accounts = readAccounts()
  if (accounts.some((a) => a.email === email)) {
    throw new ServiceError(
      'email_taken',
      'Já existe uma conta com esse e-mail neste aparelho. Use "Entrar".',
    )
  }
  if (input.type !== 'cpf' && input.type !== 'cnpj') {
    throw new ServiceError('invalid_type', 'Tipo de conta inválido.')
  }
  const account = buildAccount(input)
  saveAccounts([...accounts, account])
  startSession(account.id)
  return account
}

/** Entrada de morador/comércio: só e-mail (não há senha de cidadão no protótipo). */
export async function signIn({ email }) {
  await wait()
  const account = readAccounts().find((a) => a.email === normalizeEmail(email))
  if (!account) {
    throw new ServiceError(
      'not_found',
      'Não encontramos uma conta com esse e-mail neste aparelho. Crie uma conta ou use uma conta de demonstração.',
    )
  }
  if (account.type === 'admin') {
    throw new ServiceError(
      'use_admin_access',
      'Esse e-mail é de administração. Use o acesso administrativo.',
    )
  }
  startSession(account.id)
  return account
}

/** kind: 'resident' | 'business'. */
export async function signInDemo(kind) {
  await wait()
  if (kind !== 'resident' && kind !== 'business') {
    throw new ServiceError('invalid_demo', 'Conta de demonstração desconhecida.')
  }
  const account = ensureDemoAccount(kind)
  startSession(account.id)
  return account
}

export async function signInAdmin({ email, password }) {
  await wait()
  const demo = DEMO_ACCOUNTS.admin
  if (normalizeEmail(email) !== demo.email || password !== DEMO_ADMIN_PASSWORD) {
    throw new ServiceError('invalid_credentials', 'E-mail ou senha incorretos.')
  }
  const account = ensureDemoAccount('admin')
  startSession(account.id)
  return account
}

export async function signOut() {
  await wait(0)
  storage.remove(SESSION_KEY)
}

const EDITABLE_FIELDS = [
  'name',
  'businessName',
  'neighborhoodId',
  'followedPlaces',
  'privacy',
]

/** Atualiza só os campos editáveis; o resto (id, tipo, e-mail) não muda por aqui. */
export async function updateAccount(id, patch) {
  await wait()
  const accounts = readAccounts()
  const index = accounts.findIndex((a) => a.id === id)
  if (index === -1) throw new ServiceError('not_found', 'Conta não encontrada.')

  const changes = Object.fromEntries(
    Object.entries(patch).filter(([key]) => EDITABLE_FIELDS.includes(key)),
  )
  const updated = { ...accounts[index], ...changes }
  saveAccounts(accounts.map((a, i) => (i === index ? updated : a)))
  return updated
}

export async function deleteAccount(id) {
  await wait()
  await deleteAccountContent(id) // relatos, anúncios, fotos e apoios da conta
  saveAccounts(readAccounts().filter((a) => a.id !== id))
  const session = storage.read(SESSION_KEY)
  if (session?.accountId === id) storage.remove(SESSION_KEY)
}

/** Cópia dos dados da conta (o que o app guarda sobre a pessoa), para download. */
export async function exportAccountData(id) {
  await wait()
  const account = readAccounts().find((a) => a.id === id)
  if (!account) throw new ServiceError('not_found', 'Conta não encontrada.')
  return {
    exportedAt: new Date().toISOString(),
    note: 'Dados guardados somente neste aparelho (protótipo). Nenhum CPF/CNPJ é armazenado.',
    account,
  }
}
