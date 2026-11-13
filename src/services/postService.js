import { getAuthorLabel } from '../domain/account.js'
import { checkCommercialLimits } from '../domain/commercialLimits.js'
import { commercialSchema, reportSchema } from '../domain/postSchemas.js'
import { getCategory } from '../domain/reportCategories.js'
import { findSimilarReports } from '../domain/similarity.js'
import { simulateStatusEvents } from '../domain/statusSimulation.js'
import { generateSeedPosts } from '../data/seedPosts.js'
import { createId } from '../utils/id.js'
import { clock } from './clock.js'
import { deleteImages, saveImage } from './imageStore.js'
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
const POSTS_KEY = 'posts' // publicações criadas pelas pessoas (as do seed ficam no código)

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
const readUserPosts = () => storage.read(POSTS_KEY, [])
const allPosts = () => [...seedPosts(), ...readUserPosts()]

function saveUserPosts(posts) {
  if (!storage.write(POSTS_KEY, posts)) {
    throw new ServiceError(
      'storage_unavailable',
      'Não foi possível salvar neste aparelho. Verifique se o navegador permite armazenamento.',
    )
  }
}

/** Monta o que a tela precisa: estado "de agora" do relato, apoios e quem apoiou. */
function present(post, accountId, supportsMap, now) {
  const supporters = supportsMap[post.id] ?? []
  const base = {
    ...post,
    // Só o conteúdo do seed é fictício; o que a pessoa publica é dela.
    simulated: !post.authorId,
  }
  if (post.type !== 'report') return base

  const events = simulateStatusEvents(post, now)
  return {
    ...base,
    categoryLabel: getCategory(post.category).label,
    authorLabel:
      post.authorLabel ??
      getAuthorLabel({ type: 'cpf', neighborhoodId: post.neighborhoodId }),
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
  return allPosts()
    .filter((p) => wanted.has(p.neighborhoodId))
    .filter((p) => new Date(p.createdAt) <= now) // relógio voltou: o futuro não aparece
    .map((p) => present(p, accountId, supportsMap, now))
}

export async function getPost(id, accountId = null) {
  await wait()
  const post = allPosts().find((p) => p.id === id)
  if (!post) throw new ServiceError('not_found', 'Não encontramos essa publicação.')
  return present(post, accountId, readSupports(), clock.now())
}

/** Apoia ou retira o apoio. Devolve o novo estado do relato. */
export async function toggleSupport({ postId, accountId }) {
  await wait()
  const post = allPosts().find((p) => p.id === postId)
  if (!post || post.type !== 'report') {
    throw new ServiceError('not_found', 'Só relatos podem receber apoio.')
  }
  if (post.authorId === accountId) {
    throw new ServiceError('own_post', 'Você não pode apoiar o seu próprio relato.')
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

/**
 * Publica um relato. `photo` é o Blob já tratado (ver utils/image.js) ou null.
 * Valida de novo aqui: o serviço não confia na tela, como faria um backend.
 */
export async function createReport({
  account,
  category,
  neighborhoodId,
  title,
  description,
  photo,
}) {
  await wait()
  const parsed = reportSchema.safeParse({
    category,
    neighborhoodId,
    title,
    description,
    photo,
  })
  if (!parsed.success) {
    throw new ServiceError('invalid', parsed.error.issues[0].message)
  }
  const imageId = photo ? await saveImage(photo) : null
  const post = {
    id: createId('post'),
    type: 'report',
    authorId: account.id,
    authorLabel: getAuthorLabel(account), // "foto" do rótulo no momento da publicação
    neighborhoodId,
    createdAt: clock.now().toISOString(),
    title: title.trim(),
    description: description.trim(),
    category,
    imageId,
    baseSupports: 0,
  }
  saveUserPosts([...readUserPosts(), post])
  return present(post, account.id, {}, clock.now())
}

/** Publica um anúncio. Respeita os limites de frequência e de município. */
export async function createCommercialPost({
  account,
  neighborhoodId,
  title,
  description,
}) {
  await wait()
  const parsed = commercialSchema.safeParse({ neighborhoodId, title, description })
  if (!parsed.success) {
    throw new ServiceError('invalid', parsed.error.issues[0].message)
  }
  const now = clock.now()
  const mine = readUserPosts().filter((p) => p.authorId === account.id)
  const limit = checkCommercialLimits({ account, neighborhoodId, existing: mine, now })
  if (!limit.ok) throw new ServiceError('limit_reached', limit.error)

  const post = {
    id: createId('post'),
    type: 'commercial',
    authorId: account.id,
    neighborhoodId,
    createdAt: now.toISOString(),
    title: title.trim(),
    description: description.trim(),
    businessName: account.businessName || 'Comércio local',
  }
  saveUserPosts([...readUserPosts(), post])
  return present(post, account.id, {}, now)
}

/** Quantos anúncios a conta ainda pode publicar, para a tela avisar antes de enviar. */
export async function getCommercialStatus({ account, neighborhoodId }) {
  await wait(0)
  const mine = readUserPosts().filter((p) => p.authorId === account.id)
  return checkCommercialLimits({
    account,
    neighborhoodId,
    existing: mine,
    now: clock.now(),
  })
}

/** Relatos parecidos com o rascunho, para evitar duplicatas. */
export async function findSimilar({
  neighborhoodId,
  category,
  title,
  description,
  accountId = null,
}) {
  await wait(100)
  const now = clock.now()
  const supports = readSupports()
  const candidates = allPosts()
    .filter((p) => p.type === 'report' && p.neighborhoodId === neighborhoodId)
    .filter((p) => new Date(p.createdAt) <= now)
    .map((p) => present(p, accountId, supports, now))
  return findSimilarReports(
    { neighborhoodId, category, title, description },
    candidates,
    now,
  )
}

/** Apaga o que a conta publicou (relatos, anúncios e fotos) e os apoios dela. */
export async function deleteAccountContent(accountId) {
  const mine = readUserPosts().filter((p) => p.authorId === accountId)
  await deleteImages(mine.map((p) => p.imageId).filter(Boolean)).catch(() => {})
  saveUserPosts(readUserPosts().filter((p) => p.authorId !== accountId))
  const supports = readSupports()
  const cleaned = Object.fromEntries(
    Object.entries(supports).map(([postId, ids]) => [
      postId,
      ids.filter((id) => id !== accountId),
    ]),
  )
  storage.write(SUPPORTS_KEY, cleaned)
}
