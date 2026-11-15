import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessibilityProvider } from '../context/AccessibilityContext.jsx'
import { ClockProvider } from '../context/ClockContext.jsx'
import { SessionProvider } from '../context/SessionContext.jsx'
import * as accounts from '../services/accountService.js'
import { clock } from '../services/clock.js'
import { createReport } from '../services/postService.js'
import { AppRoutes } from './App.jsx'
import { createQueryClient } from './queryClient.js'

// O jsdom não tem canvas nem createImageBitmap: a compressão é testada no navegador.
vi.mock('../utils/image.js', () => ({
  compressImage: vi.fn(async () => new Blob(['jpeg'], { type: 'image/jpeg' })),
}))

function renderAt(path) {
  return render(
    <QueryClientProvider client={createQueryClient({ retry: false, staleTime: 0 })}>
      <AccessibilityProvider>
        <ClockProvider>
          <SessionProvider>
            <MemoryRouter initialEntries={[path]}>
              <AppRoutes />
            </MemoryRouter>
          </SessionProvider>
        </ClockProvider>
      </AccessibilityProvider>
    </QueryClientProvider>,
  )
}

const heading = (name, level = 1) => screen.findByRole('heading', { level, name })
const slow = { timeout: 4000 }

beforeEach(() => {
  clock.reset()
  URL.createObjectURL = vi.fn(() => 'blob:teste')
  URL.revokeObjectURL = vi.fn()
})

async function fillReport(
  user,
  { category = 'Buraco ou pavimento', title, description } = {},
) {
  await user.selectOptions(await screen.findByLabelText(/^Categoria/), category)
  await user.type(screen.getByLabelText(/^Título/), title ?? 'Cratera enorme na avenida')
  await user.type(
    screen.getByLabelText(/^Descrição/),
    description ??
      'Uma cratera enorme abriu na avenida e os carros precisam desviar dela.',
  )
}

const choosePhoto = async (user, container) =>
  user.upload(
    container.querySelector('input[type="file"]'),
    new File(['x'], 'foto.jpg', { type: 'image/jpeg' }),
  )

describe('Relatar um problema', () => {
  it('mostra os erros de cada campo ao enviar vazio', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    renderAt('/relatar')
    await user.click(await screen.findByRole('button', { name: 'Publicar relato' }))
    expect(await screen.findByText('Escolha a categoria.')).toBeInTheDocument()
    expect(screen.getByText(/título com pelo menos 5 letras/)).toBeInTheDocument()
    expect(screen.getByText(/pelo menos 20 caracteres/)).toBeInTheDocument()
  })

  it('categoria que exige foto: bloqueia sem foto e publica com foto', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    const { container } = renderAt('/relatar')
    await fillReport(user)
    expect(screen.getByText('Nesta categoria a foto é obrigatória.')).toBeInTheDocument()
    expect(screen.getByText('(obrigatória)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Publicar relato' }))
    expect(await screen.findByText(/a foto é obrigatória: ela ajuda/)).toBeInTheDocument()

    await choosePhoto(user, container)
    expect(await screen.findByRole('button', { name: 'Trocar foto' })).toBeInTheDocument()
    expect(screen.getByAltText('Prévia da foto escolhida')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Publicar relato' }))
    expect(await heading('Cratera enorme na avenida')).toBeInTheDocument()
    expect(screen.getByText('Seu relato · 0 apoios')).toBeInTheDocument()
    expect(screen.getAllByText('Recebida').length).toBeGreaterThan(0) // selo e etapa da linha do tempo
    expect(
      await screen.findByAltText('Foto enviada pelo morador: Cratera enorme na avenida'),
    ).toBeInTheDocument()
    // conteúdo do próprio morador não leva o selo "Simulado" no cartão; só as etapas simuladas
    expect(screen.queryByText('Simulado')).not.toBeInTheDocument()
    expect(screen.getByText('Morador(a) de Pinheiros')).toBeInTheDocument()
  })

  it('categoria com foto opcional publica sem foto', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    renderAt('/relatar')
    await fillReport(user, {
      category: 'Iluminação pública',
      title: 'Poste apagado há dias',
    })
    expect(screen.getByText('Nesta categoria a foto é opcional.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Publicar relato' }))
    expect(await heading('Poste apagado há dias')).toBeInTheDocument()
  })

  it('o relato publicado aparece no feed do bairro, com botão "Seu relato"', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    renderAt('/relatar')
    await fillReport(user, {
      category: 'Iluminação pública',
      title: 'Poste apagado há dias',
    })
    await user.click(screen.getByRole('button', { name: 'Publicar relato' }))
    await heading('Poste apagado há dias')

    await user.click(screen.getByRole('link', { name: 'Voltar ao início' }))
    expect(await screen.findByText('Poste apagado há dias')).toBeInTheDocument()
    expect(screen.getAllByText(/Seu relato · 0 apoios/).length).toBe(1)
  })

  it('sugere relatos parecidos e deixa apoiar em vez de duplicar', async () => {
    await createReport({
      account: { id: 'acc_vizinha', type: 'cpf', neighborhoodId: 'sao-paulo/pinheiros' },
      category: 'road',
      neighborhoodId: 'sao-paulo/pinheiros',
      title: 'Cratera enorme na avenida',
      description:
        'Uma cratera enorme abriu na avenida e os carros precisam desviar dela.',
      photo: new Blob(['x'], { type: 'image/jpeg' }),
    })
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    renderAt('/relatar')
    await fillReport(user, {
      title: 'Cratera na avenida',
      description: 'os carros desviam da cratera',
    })

    expect(await heading('Já existem relatos parecidos', 2)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Apoiar · 0' }, slow))
    expect(
      await screen.findByRole('button', { name: 'Apoiado · 1' }, slow),
    ).toBeInTheDocument()
  })

  it('não sugere nada quando não há relato parecido', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    renderAt('/relatar')
    await fillReport(user, { category: 'Árvore', title: 'Galho enorme prestes a cair' })
    await new Promise((r) => setTimeout(r, 1000))
    expect(screen.queryByText('Já existem relatos parecidos')).not.toBeInTheDocument()
  })

  it('só moradores relatam; sem bairro acompanhado, pede para escolher um', async () => {
    await accounts.signInDemo('business')
    const first = renderAt('/relatar')
    expect(
      await screen.findByText(/Só contas de morador publicam relatos/),
    ).toBeInTheDocument()
    first.unmount()

    const resident = await accounts.signInDemo('resident')
    await accounts.updateAccount(resident.id, { followedPlaces: [] })
    renderAt('/relatar')
    expect(await heading('Escolha um bairro primeiro', 2)).toBeInTheDocument()
  })

  it('visitante que toca em "Relatar" entra e cai no formulário', async () => {
    const user = userEvent.setup()
    renderAt('/inicio')
    await user.click(await screen.findByRole('button', { name: 'Relatar um problema' }))
    await user.click(
      await screen.findByRole('button', { name: 'Entrar como morador(a)' }),
    )
    expect(await heading('Relatar um problema')).toBeInTheDocument()
  })
})

describe('Criar anúncio (comércio)', () => {
  async function fillAd(user, title) {
    await user.clear(await screen.findByLabelText(/^Título/))
    await user.type(screen.getByLabelText(/^Título/), title)
    await user.clear(screen.getByLabelText(/^Texto do anúncio/))
    await user.type(
      screen.getByLabelText(/^Texto do anúncio/),
      'Todos os dias, pão francês quentinho a partir das 6h da manhã.',
    )
  }

  it('publica como "Publicidade", com o nome do comércio', async () => {
    await accounts.signInDemo('business')
    const user = userEvent.setup()
    renderAt('/anunciar')
    await fillAd(user, 'Pão quentinho às 6h')
    await user.click(screen.getByRole('button', { name: 'Publicar anúncio' }))
    expect(await heading('Pão quentinho às 6h')).toBeInTheDocument()
    expect(screen.getByText('Publicidade')).toBeInTheDocument()
    expect(screen.getByText('Padaria Exemplo')).toBeInTheDocument()
  })

  it('o terceiro anúncio da semana é barrado, com aviso e botão desativado', async () => {
    await accounts.signInDemo('business')
    const user = userEvent.setup()
    const first = renderAt('/anunciar')
    await fillAd(user, 'Primeiro anúncio')
    await user.click(screen.getByRole('button', { name: 'Publicar anúncio' }))
    await heading('Primeiro anúncio')
    first.unmount()

    const second = renderAt('/anunciar')
    await fillAd(user, 'Segundo anúncio')
    await user.click(screen.getByRole('button', { name: 'Publicar anúncio' }))
    await heading('Segundo anúncio')
    second.unmount()

    renderAt('/anunciar')
    expect(await screen.findByText('Limite de anúncios')).toBeInTheDocument()
    expect(screen.getByText(/já publicou 2 anúncios nesta semana/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar anúncio' })).toBeDisabled()
  })

  it('só comércio anuncia; o botão aparece só para ele', async () => {
    await accounts.signInDemo('resident')
    const first = renderAt('/anunciar')
    expect(
      await screen.findByText(/Só contas de comércio local criam anúncios/),
    ).toBeInTheDocument()
    first.unmount()

    renderAt('/inicio')
    await screen.findAllByRole('article')
    expect(
      screen.queryByRole('button', { name: 'Criar anúncio' }),
    ).not.toBeInTheDocument()
  })
})

describe('Meus relatos', () => {
  it('sem relatos, explica e leva para Relatar um problema', async () => {
    await accounts.signInDemo('resident')
    renderAt('/perfil/publicacoes')
    expect(await heading('Meus relatos')).toBeInTheDocument()
    expect(await screen.findByText('Você ainda não publicou relatos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Relatar um problema' })).toHaveAttribute(
      'href',
      '/relatar',
    )
  })

  it('lista só os relatos da própria pessoa, do mais novo ao mais antigo, e abre o histórico', async () => {
    const resident = await accounts.signInDemo('resident')
    const base = {
      account: resident,
      category: 'road',
      neighborhoodId: resident.neighborhoodId ?? 'sao-paulo/pinheiros',
      description: 'Descrição longa o bastante para passar na validação do serviço.',
      photo: new Blob(['x'], { type: 'image/jpeg' }),
    }
    await createReport({ ...base, title: 'Primeiro relato meu' })
    clock.advance(3_600_000)
    await createReport({ ...base, title: 'Segundo relato meu' })
    await createReport({
      ...base,
      account: { id: 'acc_outra', type: 'cpf', neighborhoodId: base.neighborhoodId },
      title: 'Relato de outra pessoa',
    })

    const user = userEvent.setup()
    renderAt('/perfil/publicacoes')
    const list = await screen.findByRole('list', { name: 'Seus relatos' })
    const titles = [...list.querySelectorAll('h3')].map((h) => h.textContent)
    expect(titles).toEqual(['Segundo relato meu', 'Primeiro relato meu'])
    expect(screen.queryByText('Relato de outra pessoa')).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Acompanhar' })[0])
    expect(await heading('Segundo relato meu')).toBeInTheDocument()
    expect(await heading('Acompanhamento do relato', 2)).toBeInTheDocument()
  })

  it('comércio vê "Meus anúncios"', async () => {
    await accounts.signInDemo('business')
    renderAt('/perfil/publicacoes')
    expect(await heading('Meus anúncios')).toBeInTheDocument()
    expect(await screen.findByText('Nenhum anúncio ainda')).toBeInTheDocument()
  })

  it('o perfil tem o atalho', async () => {
    await accounts.signInDemo('resident')
    renderAt('/perfil')
    expect(await screen.findByRole('link', { name: /Meus relatos/ })).toHaveAttribute(
      'href',
      '/perfil/publicacoes',
    )
  })
})
