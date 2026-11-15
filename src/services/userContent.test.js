import { beforeEach, describe, expect, it } from 'vitest'
import { fitWithin } from '../utils/image.js'
import * as accounts from './accountService.js'
import { clock } from './clock.js'
import { getImage, saveImage } from './imageStore.js'
import {
  createCommercialPost,
  createReport,
  findSimilar,
  getCommercialStatus,
  getPost,
  listPosts,
  recordAdminStatus,
  toggleSupport,
} from './postService.js'

const DAY = 86_400_000
const PLACE = 'sao-paulo/pinheiros'
const photo = () => new Blob(['foto'], { type: 'image/jpeg' })
const report = (over = {}) => ({
  category: 'road',
  neighborhoodId: PLACE,
  title: 'Cratera enorme na avenida',
  description: 'Uma cratera enorme abriu na avenida e os carros precisam desviar dela.',
  photo: photo(),
  ...over,
})

let resident
let business
beforeEach(async () => {
  clock.reset()
  resident = await accounts.signInDemo('resident')
  business = await accounts.signInDemo('business')
})

describe('imageStore', () => {
  it('guarda e devolve a foto; id desconhecido dá null', async () => {
    const id = await saveImage(new Blob(['abc'], { type: 'image/jpeg' }))
    expect(id).toMatch(/^img_/)
    // O fake-indexeddb não clona o Blob do jsdom, então aqui só dá para conferir que
    // algo foi guardado; a gravação de um Blob real é verificada no navegador.
    expect(await getImage(id)).not.toBeNull()
    expect(await getImage('img_nao_existe')).toBeNull()
  })
})

describe('fitWithin', () => {
  it('reduz o lado maior mantendo a proporção e nunca amplia', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 960, height: 1280 })
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('createReport', () => {
  it('publica o relato, guarda a foto e ele aparece no feed como conteúdo do morador', async () => {
    const created = await createReport({ account: resident, ...report() })
    expect(created).toMatchObject({
      type: 'report',
      status: 'received',
      supports: 0,
      simulated: false,
      authorLabel: 'Morador(a) de Pinheiros',
    })
    expect(created.imageId).toMatch(/^img_/)
    expect(await getImage(created.imageId)).not.toBeNull()

    const feed = await listPosts({ neighborhoodIds: [PLACE] })
    expect(feed.find((p) => p.id === created.id)).toBeTruthy()
    expect((await getPost(created.id)).title).toBe('Cratera enorme na avenida')
  })

  it('o rótulo do autor é uma "foto" do momento da publicação', async () => {
    await accounts.updateAccount(resident.id, {
      privacy: { authorDisplay: 'first_name' },
    })
    const fresh = await accounts.signInDemo('resident')
    const created = await createReport({ account: fresh, ...report() })
    expect(created.authorLabel).toBe('Marina · Pinheiros')
  })

  it('exige foto nas categorias que pedem e aceita sem foto nas outras', async () => {
    await expect(
      createReport({ account: resident, ...report({ photo: null }) }),
    ).rejects.toMatchObject({
      code: 'invalid',
      message: expect.stringMatching(/foto é obrigatória/),
    })
    const ok = await createReport({
      account: resident,
      ...report({ category: 'lighting', photo: null }),
    })
    expect(ok.imageId).toBeNull()
  })

  it('recusa dados inválidos mesmo se a tela deixasse passar', async () => {
    await expect(
      createReport({ account: resident, ...report({ title: 'ab' }) }),
    ).rejects.toMatchObject({ code: 'invalid' })
  })

  it('o autor não pode apoiar o próprio relato; outro morador pode', async () => {
    const created = await createReport({ account: resident, ...report() })
    await expect(
      toggleSupport({ postId: created.id, accountId: resident.id }),
    ).rejects.toMatchObject({ code: 'own_post' })
    const supported = await toggleSupport({ postId: created.id, accountId: 'acc_outra' })
    expect(supported.supports).toBe(1)
  })

  it('o relato novo também ganha ciclo simulado com o passar do tempo', async () => {
    const created = await createReport({ account: resident, ...report() })
    clock.advance(400 * DAY)
    const later = await getPost(created.id)
    expect(later.events.length).toBeGreaterThanOrEqual(created.events.length)
    expect(later.events.slice(1).every((e) => e.simulated === true)).toBe(true)
  })
})

describe('relatos parecidos', () => {
  it('encontra o relato recém-criado ao descrever o mesmo problema', async () => {
    const created = await createReport({ account: resident, ...report() })
    const similar = await findSimilar({
      neighborhoodId: PLACE,
      category: 'road',
      title: 'Cratera na avenida',
      description: 'carros desviam da cratera',
    })
    expect(similar.map((p) => p.id)).toContain(created.id)
  })

  it('não sugere nada de outra categoria ou outro bairro', async () => {
    await createReport({ account: resident, ...report() })
    const draft = {
      title: 'Cratera na avenida',
      description: 'carros desviam da cratera',
    }
    expect(
      await findSimilar({ ...draft, neighborhoodId: PLACE, category: 'tree' }),
    ).toEqual([])
    expect(
      await findSimilar({ ...draft, neighborhoodId: 'santos/gonzaga', category: 'road' }),
    ).toEqual([])
  })
})

describe('createCommercialPost', () => {
  const ad = (over = {}) => ({
    neighborhoodId: 'sao-paulo/vila-mariana',
    title: 'Pão quentinho às 6h',
    description: 'Todos os dias, pão francês quentinho a partir das 6h da manhã.',
    ...over,
  })

  it('publica com o nome do comércio, como publicidade', async () => {
    const post = await createCommercialPost({ account: business, ...ad() })
    expect(post).toMatchObject({
      type: 'commercial',
      businessName: 'Padaria Exemplo',
      simulated: false,
    })
  })

  it('limita a 2 por semana e libera depois de 7 dias', async () => {
    await createCommercialPost({ account: business, ...ad() })
    await createCommercialPost({ account: business, ...ad({ title: 'Outro anúncio' }) })
    await expect(
      createCommercialPost({ account: business, ...ad({ title: 'Terceiro anúncio' }) }),
    ).rejects.toMatchObject({ code: 'limit_reached' })
    expect(
      (
        await getCommercialStatus({
          account: business,
          neighborhoodId: 'sao-paulo/mooca',
        })
      ).ok,
    ).toBe(false)

    clock.advance(8 * DAY)
    expect(
      (
        await createCommercialPost({
          account: business,
          ...ad({ title: 'Voltei a anunciar' }),
        })
      ).id,
    ).toBeTruthy()
  })

  it('só publica em bairros do município do comércio', async () => {
    await expect(
      createCommercialPost({
        account: business,
        ...ad({ neighborhoodId: 'santos/gonzaga' }),
      }),
    ).rejects.toMatchObject({
      code: 'limit_reached',
      message: expect.stringMatching(/São Paulo/),
    })
  })
})

describe('download dos dados', () => {
  it('inclui o que a conta publicou (sem a foto) e a que deu apoio', async () => {
    const mine = await createReport({ account: resident, ...report() })
    await createReport({
      account: { id: 'acc_outra', type: 'cpf', neighborhoodId: PLACE },
      ...report({ title: 'Relato de outra pessoa' }),
    })
    const seedReport = (await listPosts({ neighborhoodIds: [PLACE] })).find(
      (p) => p.type === 'report' && !p.authorId,
    )
    await toggleSupport({ postId: seedReport.id, accountId: resident.id })

    const data = await accounts.exportAccountData(resident.id)
    expect(data.publications.map((p) => p.id)).toEqual([mine.id])
    expect(data.publications[0]).toMatchObject({ hasPhoto: true })
    expect(data.publications[0]).not.toHaveProperty('imageId')
    expect(data.supportsGiven).toEqual([seedReport.id])
  })
})

describe('excluir a conta apaga o que ela publicou', () => {
  it('remove relatos, fotos e apoios', async () => {
    const created = await createReport({ account: resident, ...report() })
    await toggleSupport({ postId: created.id, accountId: 'acc_outra' })
    const seedReport = (await listPosts({ neighborhoodIds: [PLACE] })).find(
      (p) => p.type === 'report' && !p.authorId,
    )
    const before = seedReport.supports
    await toggleSupport({ postId: seedReport.id, accountId: resident.id })

    await accounts.deleteAccount(resident.id)

    await expect(getPost(created.id)).rejects.toMatchObject({ code: 'not_found' })
    expect(await getImage(created.imageId)).toBeNull()
    expect((await getPost(seedReport.id, resident.id)).supports).toBe(before)
  })

  it('remove também as ações da administração sobre os relatos apagados', async () => {
    const created = await createReport({ account: resident, ...report() })
    await recordAdminStatus(created.id, {
      status: 'in_review',
      at: new Date().toISOString(),
      by: 'admin',
      simulated: false,
    })
    expect(window.localStorage.getItem('nossa-rua:v1:admin-events')).toContain(created.id)

    await accounts.deleteAccount(resident.id)

    expect(window.localStorage.getItem('nossa-rua:v1:admin-events')).not.toContain(
      created.id,
    )
  })
})
