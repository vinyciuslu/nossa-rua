import { generateSeedState } from '../data/seedState.js'
import { wait } from './latency.js'
import { clock } from './clock.js'
import { seedEpoch } from './seedEpoch.js'
import { ServiceError } from './ServiceError.js'
import { storage } from './storage.js'

/**
 * Feed estadual: alertas, notícias e eventos. Todo o conteúdo vem do seed
 * (fictício); o que a pessoa produz aqui são os eventos que salvou.
 */

const SAVED_KEY = 'saved-events' // { [accountId]: [eventId, ...] }

let seedCache = { epoch: null, items: [] }
function seedItems() {
  const epoch = seedEpoch()
  if (seedCache.epoch !== epoch) seedCache = { epoch, items: generateSeedState(epoch) }
  return seedCache.items
}

const readSaved = () => storage.read(SAVED_KEY, {})

/** Tudo no feed estadual é fictício; eventos ganham o "salvo" desta conta. */
function present(item, accountId, savedMap) {
  const base = { ...item, simulated: true }
  if (item.kind !== 'event') return base
  return {
    ...base,
    saved: Boolean(accountId) && (savedMap[accountId] ?? []).includes(item.id),
  }
}

/** Todos os itens já publicados (a região e o tipo são filtrados pelo domínio, na tela). */
export async function listStateItems({ accountId = null } = {}) {
  await wait()
  const saved = readSaved()
  return seedItems().map((item) => present(item, accountId, saved))
}

export async function getStateItem(id, accountId = null) {
  await wait()
  const item = seedItems().find((i) => i.id === id)
  // Item "do futuro" (o relógio de demonstração voltou) não existe ainda.
  if (!item || new Date(item.publishedAt) > clock.now()) {
    throw new ServiceError('not_found', 'Não encontramos esse conteúdo.')
  }
  return present(item, accountId, readSaved())
}

/** Salva ou remove o evento da lista da conta. Devolve o evento atualizado. */
export async function toggleSavedEvent({ eventId, accountId }) {
  await wait()
  const item = seedItems().find((i) => i.id === eventId)
  if (!item || item.kind !== 'event') {
    throw new ServiceError('not_found', 'Só eventos podem ser salvos.')
  }
  const map = readSaved()
  const current = map[accountId] ?? []
  const next = current.includes(eventId)
    ? current.filter((id) => id !== eventId)
    : [...current, eventId]
  const updated = { ...map, [accountId]: next }
  if (!storage.write(SAVED_KEY, updated)) {
    throw new ServiceError(
      'storage_unavailable',
      'Não foi possível salvar o evento neste aparelho.',
    )
  }
  return present(item, accountId, updated)
}

/** Ids dos eventos salvos pela conta (para o download dos dados). */
export function listSavedEventIds(accountId) {
  return readSaved()[accountId] ?? []
}

/** Remove os eventos salvos da conta (usado ao excluir a conta). */
export function deleteAccountSavedEvents(accountId) {
  const { [accountId]: _removed, ...rest } = readSaved()
  storage.write(SAVED_KEY, rest)
}
