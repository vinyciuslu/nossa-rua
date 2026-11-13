import { getAuthorLabel } from '../domain/account.js'
import { getCategory } from '../domain/reportCategories.js'
import { simulateStatusEvents } from '../domain/statusSimulation.js'
import { generateSeedPosts } from '../data/seedPosts.js'
import { clock } from './clock.js'
import { wait } from './latency.js'
import { ServiceError } from './ServiceError.js'
import { storage } from './storage.js'

/**
 * Publicações (relatos, avisos, comércio) e apoios.
 *
 * Por enquanto todas vêm do seed. As telas só conhecem as funções exportadas;
 * a Etapa 3B acrescenta as publicações criadas pela pessoa no mesmo lugar.
 */

const EPOCH_KEY = 'seed-epoch'
const SUPPORTS_KEY = 'supports' // { [postId]: [accountId, ...] }

/** Momento em que este aparelho abriu o app pela primeira vez: âncora das datas do seed. */
function seedEpoch() {
  const saved = storage.read(EPOCH_KEY)
  if (typeof saved === 'number') return saved
  const now = Date.now()
  storage.write(EPOCH_KEY, now)
  return now
}

let seedCache = { epoch: null, posts: [] }
function seedPosts() {
  const epoch = seedEpoch()
  if (seedCache.epoch !== epoch) seedCache = { epoch, posts: generateSeedPosts(epoch) }
  return seedCache.posts
}

const readSupports = () => storage.read(SUPPORTS_KEY, {})

/** Monta o que a tela precisa: estado "de agora" do relato, apoios e quem apoiou. */
function present(post, accountId, supportsMap, now) {
  const supporters = supportsMap[post.id] ?? []
  const base = {
    ...post,
    simulated: true,
  }
  if (post.type !== 'report') return base

  const events = simulateStatusEvents(post, now)
  return {
    ...base,
    categoryLabel: getCategory(post.category).label,
    authorLabel: getAuthorLabel({ type: 'cpf', neighborhoodId: post.neighborhoodId }),
    events,
    status: events.at(-1).status,
    supports: (post.baseSupports ?? 0) + supporters.length,
    supported: Boolean(accountId) && supporters.includes(accountId),
  }
}

/** Publicações dos bairros pedidos (sem ordenar: a ordem é regra do domínio/tela). */
export async function listPosts({ neighborhoodIds, accountId = null }) {
  await wait()
  const wanted = new Set(neighborhoodIds)
  const supportsMap = readSupports()
  const now = clock.now()
  return seedPosts()
    .filter((p) => wanted.has(p.neighborhoodId))
    .filter((p) => new Date(p.createdAt) <= now) // relógio voltou: o futuro não aparece
    .map((p) => present(p, accountId, supportsMap, now))
}

export async function getPost(id, accountId = null) {
  await wait()
  const post = seedPosts().find((p) => p.id === id)
  if (!post) throw new ServiceError('not_found', 'Não encontramos essa publicação.')
  return present(post, accountId, readSupports(), clock.now())
}

/** Apoia ou retira o apoio. Devolve o novo estado do relato. */
export async function toggleSupport({ postId, accountId }) {
  await wait()
  const post = seedPosts().find((p) => p.id === postId)
  if (!post || post.type !== 'report') {
    throw new ServiceError('not_found', 'Só relatos podem receber apoio.')
  }
  const map = readSupports()
  const current = map[postId] ?? []
  const next = current.includes(accountId)
    ? current.filter((id) => id !== accountId)
    : [...current, accountId]
  const saved = storage.write(SUPPORTS_KEY, { ...map, [postId]: next })
  if (!saved) {
    throw new ServiceError(
      'storage_unavailable',
      'Não foi possível salvar o apoio neste aparelho.',
    )
  }
  return present(post, accountId, { ...map, [postId]: next }, clock.now())
}
