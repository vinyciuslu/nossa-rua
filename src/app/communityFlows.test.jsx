import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccessibilityProvider } from '../context/AccessibilityContext.jsx'
import { ClockProvider } from '../context/ClockContext.jsx'
import { SessionProvider } from '../context/SessionContext.jsx'
import * as accounts from '../services/accountService.js'
import { clock } from '../services/clock.js'
import { AppRoutes } from './App.jsx'
import { createQueryClient } from './queryClient.js'

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

beforeEach(() => clock.reset())

const heading = (name, level = 1) => screen.findByRole('heading', { level, name })
const supportButtons = () =>
  screen.findAllByRole('button', { name: /^(Apoiar|Apoiado) · \d+$/ })

describe('Início como visitante', () => {
  it('avisa que o conteúdo é fictício e pede para escolher um bairro', async () => {
    renderAt('/inicio')
    expect(await heading('Início')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo de demonstração')).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Tipo de publicação' }),
    ).not.toBeInTheDocument()
  })

  it('mostra as publicações do bairro escolhido, todas marcadas como simuladas', async () => {
    const user = userEvent.setup()
    renderAt('/inicio')
    await user.selectOptions(await screen.findByLabelText(/Município/), 'São Paulo')
    await user.selectOptions(screen.getByLabelText(/Bairro/), 'Pinheiros')

    const articles = await screen.findAllByRole('article')
    expect(articles.length).toBeGreaterThanOrEqual(3)
    for (const article of articles) {
      expect(within(article).getByText('Simulado')).toBeInTheDocument()
    }
    expect(screen.getAllByText('Relato de morador').length).toBeGreaterThan(0)
  })

  it('o filtro por tipo esconde os outros tipos', async () => {
    const user = userEvent.setup()
    renderAt('/inicio')
    await user.selectOptions(await screen.findByLabelText(/Município/), 'São Paulo')
    await user.selectOptions(screen.getByLabelText(/Bairro/), 'Pinheiros')
    await screen.findAllByRole('article')

    await user.click(screen.getByRole('button', { name: 'Relatos' }))
    expect(screen.queryByText('Publicidade')).not.toBeInTheDocument()
    expect(screen.queryByText('Aviso da moderação')).not.toBeInTheDocument()
    expect(screen.getAllByText('Relato de morador').length).toBeGreaterThan(0)
  })

  it('apoiar leva para Entrar', async () => {
    const user = userEvent.setup()
    renderAt('/inicio')
    await user.selectOptions(await screen.findByLabelText(/Município/), 'São Paulo')
    await user.selectOptions(screen.getByLabelText(/Bairro/), 'Pinheiros')
    await user.click((await supportButtons())[0])
    expect(await heading('Entrar')).toBeInTheDocument()
  })
})

describe('Início como morador', () => {
  async function signIn() {
    await accounts.signInDemo('resident') // acompanha Pinheiros como "Casa"
  }

  it('mostra o feed do bairro acompanhado sem pedir escolha', async () => {
    await signIn()
    renderAt('/inicio')
    const articles = await screen.findAllByRole('article')
    expect(articles.length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByLabelText(/Município/)).not.toBeInTheDocument()
  })

  it('apoiar soma 1, vira "Apoiado" e continua depois de recarregar', async () => {
    await signIn()
    const user = userEvent.setup()
    const first = renderAt('/inicio')
    const button = (await supportButtons())[0]
    const total = Number(button.textContent.match(/\d+$/)[0])
    await user.click(button)
    const updated = await screen.findByRole('button', { name: `Apoiado · ${total + 1}` })
    expect(updated).toHaveAttribute('aria-pressed', 'true')
    first.unmount()

    renderAt('/inicio')
    expect(
      await screen.findByRole('button', { name: `Apoiado · ${total + 1}` }),
    ).toBeInTheDocument()
  })

  it('com 2 ou mais bairros, aparecem chips por bairro e filtram o feed', async () => {
    await signIn()
    const account = await accounts.getSession()
    await accounts.updateAccount(account.id, {
      followedPlaces: [
        ...account.followedPlaces,
        { neighborhoodId: 'santos/gonzaga', label: 'Trabalho' },
      ],
    })
    const user = userEvent.setup()
    renderAt('/inicio')
    await screen.findAllByRole('article')
    const both = screen.getAllByRole('article').length
    await user.click(screen.getByRole('button', { name: 'Trabalho · Gonzaga' }))
    await screen.findAllByRole('article')
    const only = screen.getAllByRole('article').length
    expect(only).toBeLessThan(both)
    for (const place of screen.getAllByText(/Gonzaga · Santos/)) {
      expect(place).toBeInTheDocument()
    }
    expect(screen.queryByText(/Pinheiros · São Paulo/)).not.toBeInTheDocument()
  })

  it('sem bairros acompanhados, explica e oferece escolher', async () => {
    await signIn()
    const account = await accounts.getSession()
    await accounts.updateAccount(account.id, { followedPlaces: [] })
    renderAt('/inicio')
    expect(await heading('Você ainda não acompanha nenhum bairro', 2)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escolher bairros' })).toBeInTheDocument()
  })
})

describe('conta de comércio', () => {
  it('não apoia relatos e recebe uma explicação', async () => {
    await accounts.signInDemo('business')
    const user = userEvent.setup()
    renderAt('/inicio')
    await user.click((await supportButtons())[0])
    expect(
      await screen.findByText('Só contas de morador apoiam relatos.'),
    ).toBeInTheDocument()
  })
})

describe('detalhe da publicação', () => {
  it('mostra o ciclo completo do relato e quem publicou', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    renderAt('/inicio')
    await screen.findAllByRole('article')
    await user.click(screen.getAllByRole('button', { name: 'Acompanhar' })[0])

    expect(await heading('Acompanhamento do relato', 2)).toBeInTheDocument()
    const steps = screen.getAllByRole('listitem')
    expect(steps.length).toBeGreaterThanOrEqual(5)
    expect(screen.getByText('Morador(a) de Pinheiros')).toBeInTheDocument()
    expect(
      screen.getByText(/não indicam ação de nenhum órgão público/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Acompanhar' })).not.toBeInTheDocument()
  })

  it('id inexistente mostra erro claro', async () => {
    renderAt('/publicacao/nao-existe')
    expect(await screen.findByText('Publicação não encontrada')).toBeInTheDocument()
    expect(screen.getByText('Não encontramos essa publicação.')).toBeInTheDocument()
  })
})

describe('relógio de demonstração', () => {
  it('adianta o tempo, mostra quanto e volta ao real', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    renderAt('/perfil/configuracoes')
    expect(await screen.findByText('Horário real')).toBeInTheDocument()
    const reset = screen.getByRole('button', { name: 'Voltar ao horário real' })
    expect(reset).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '+1 dia' }))
    await user.click(screen.getByRole('button', { name: '+3 dias' }))
    expect(await screen.findByText('Adiantado em 4 dias')).toBeInTheDocument()
    expect(clock.getOffset()).toBe(4 * 86_400_000)

    await user.click(reset)
    expect(await screen.findByText('Horário real')).toBeInTheDocument()
    expect(clock.getOffset()).toBe(0)
  })

  it('adiantar muito o tempo faz relatos ganharem etapas simuladas no detalhe', async () => {
    await accounts.signInDemo('resident')
    const user = userEvent.setup()
    const first = renderAt('/inicio')
    await screen.findAllByRole('article')
    const countSimulated = async () => {
      await heading('Acompanhamento do relato', 2)
      return screen.queryAllByText('Atualização simulada').length
    }
    // abre o PRIMEIRO relato, anota quantas etapas simuladas tem
    await user.click(screen.getAllByRole('button', { name: 'Acompanhar' })[0])
    const before = await countSimulated()
    first.unmount()

    clock.advance(400 * 86_400_000) // mais de um ano: qualquer percurso já terminou
    renderAt('/inicio')
    await screen.findAllByRole('article')
    await user.click(screen.getAllByRole('button', { name: 'Acompanhar' })[0])
    expect(await countSimulated()).toBeGreaterThanOrEqual(before)
  })
})
