import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
afterEach(() => vi.restoreAllMocks())

const heading = (name, level = 1) => screen.findByRole('heading', { level, name })
const article = async (title) =>
  (await screen.findByRole('heading', { name: title })).closest('article')

describe('Estado como visitante', () => {
  it('avisa que tudo é fictício, inclusive as instituições', async () => {
    renderAt('/estado')
    expect(await heading('Estado')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo de demonstração')).toBeInTheDocument()
    expect(screen.getByText(/inclusive as instituições/)).toBeInTheDocument()
  })

  it('"Tudo" mostra alertas, notícias e próximos eventos em seções', async () => {
    renderAt('/estado')
    expect(await heading('Alertas', 2)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Notícias' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Próximos eventos' }),
    ).toBeInTheDocument()
  })

  it('todo cartão é marcado como simulado e de instituição fictícia, nunca "verificada"', async () => {
    renderAt('/estado')
    const articles = await screen.findAllByRole('article')
    expect(articles.length).toBeGreaterThan(5)
    for (const a of articles) {
      expect(within(a).getByText('Simulado')).toBeInTheDocument()
      expect(within(a).getByText('Instituição fictícia')).toBeInTheDocument()
    }
    expect(screen.queryByText('Fonte institucional verificada')).not.toBeInTheDocument()
  })

  it('o alerta mais grave vem primeiro e mostra até quando vale', async () => {
    renderAt('/estado')
    const first = (await screen.findAllByRole('article'))[0]
    expect(within(first).getByText('Urgente')).toBeInTheDocument()
    expect(within(first).getByText(/^Vale até /)).toBeInTheDocument()
  })

  it('os filtros por tipo mostram só aquele tipo', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    await screen.findAllByRole('article')
    await user.click(screen.getByRole('button', { name: 'Eventos' }))
    const articles = await screen.findAllByRole('article')
    for (const a of articles) expect(within(a).getByText('Evento')).toBeInTheDocument()
    expect(screen.queryByText('Notícia')).not.toBeInTheDocument()
  })

  it('o filtro de eventos também mostra o que já aconteceu, identificado', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    await screen.findAllByRole('article')
    expect(screen.queryByText('Sessão de cinema ao ar livre')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eventos' }))
    const past = await article('Sessão de cinema ao ar livre')
    expect(within(past).getByText('Já aconteceu')).toBeInTheDocument()
  })

  it('não oferece a escolha de região (não há municípios acompanhados)', async () => {
    renderAt('/estado')
    await screen.findAllByRole('article')
    expect(screen.queryByRole('group', { name: 'Região' })).not.toBeInTheDocument()
  })

  it('salvar um evento leva para Entrar', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    const card = await article('Feira de livros, trocas e leitura')
    await user.click(within(card).getByRole('button', { name: /Salvar/ }))
    expect(await heading('Entrar')).toBeInTheDocument()
  })

  it('"Salvos" explica que é preciso entrar', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    await screen.findAllByRole('article')
    await user.click(screen.getByRole('button', { name: 'Salvos' }))
    expect(await screen.findByText('Nenhum evento salvo')).toBeInTheDocument()
    expect(screen.getByText(/Entre na sua conta/)).toBeInTheDocument()
  })

  it('o relógio adiantado faz um alerta expirar: some de "Tudo" e vira "Encerrado"', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/estado')
    await article('Tempo seco e baixa umidade') // vale por mais ~6 h
    unmount()

    clock.advance(10 * 3_600_000)
    renderAt('/estado')
    await screen.findAllByRole('article')
    expect(screen.queryByText('Tempo seco e baixa umidade')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alertas' }))
    const expired = await article('Tempo seco e baixa umidade')
    expect(within(expired).getByText('Encerrado')).toBeInTheDocument()
    expect(within(expired).getByText(/^Encerrado em /)).toBeInTheDocument()
  })
})

describe('Estado como morador', () => {
  beforeEach(async () => {
    await accounts.signInDemo('resident') // acompanha Pinheiros (São Paulo)
  })

  it('salva um evento e o encontra em "Salvos"', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    const card = await article('Feira de livros, trocas e leitura')
    const button = within(card).getByRole('button', { name: /Salvar/ })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await user.click(button)
    await waitFor(() =>
      expect(within(card).getByRole('button', { name: /Salvo/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
    expect(await screen.findByText('Evento salvo.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salvos' }))
    expect(await article('Feira de livros, trocas e leitura')).toBeInTheDocument()
    expect(screen.queryByText('Corrida e caminhada de 5 km')).not.toBeInTheDocument()
  })

  it('remove o evento dos salvos ao tocar de novo', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    const card = await article('Feira de livros, trocas e leitura')
    await user.click(within(card).getByRole('button', { name: /Salvar/ }))
    await user.click(await within(card).findByRole('button', { name: /Salvo/ }))
    expect(await screen.findByText('Evento removido dos salvos.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvos' }))
    expect(await screen.findByText('Nenhum evento salvo')).toBeInTheDocument()
    expect(screen.getByText(/Toque em/)).toBeInTheDocument()
  })

  it('"Salvos" mostra eventos de outros municípios mesmo com "Meus municípios" ligado', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    const card = await article('Feira de livros, trocas e leitura') // Campinas
    await user.click(within(card).getByRole('button', { name: /Salvar/ }))
    await within(card).findByRole('button', { name: /Salvo/ })

    await user.click(screen.getByRole('button', { name: 'Meus municípios' }))
    await user.click(screen.getByRole('button', { name: 'Salvos' }))
    expect(await article('Feira de livros, trocas e leitura')).toBeInTheDocument()
  })

  it('"Meus municípios" mantém o conteúdo estadual e o dos municípios acompanhados', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    await article('Maré alta no fim de semana') // Santos, aparece em "Todo o estado"

    await user.click(screen.getByRole('button', { name: 'Meus municípios' }))
    await waitFor(() =>
      expect(screen.queryByText('Maré alta no fim de semana')).not.toBeInTheDocument(),
    )
    expect(
      screen.queryByText('Risco de alagamento em vias baixas'),
    ).not.toBeInTheDocument() // Campinas
    expect(
      screen.getByText('Previsão de chuva forte em várias regiões'), // estadual
    ).toBeInTheDocument()
    expect(screen.getByText('Tempo seco e baixa umidade')).toBeInTheDocument() // São Paulo

    await user.click(screen.getByRole('button', { name: 'Todo o estado' }))
    expect(await screen.findByText('Maré alta no fim de semana')).toBeInTheDocument()
  })
})

describe('Estado como comércio', () => {
  it('também pode salvar eventos', async () => {
    await accounts.signInDemo('business')
    const user = userEvent.setup()
    renderAt('/estado')
    const card = await article('Feira de livros, trocas e leitura')
    await user.click(within(card).getByRole('button', { name: /Salvar/ }))
    expect(await within(card).findByRole('button', { name: /Salvo/ })).toBeInTheDocument()
  })
})

describe('Detalhe', () => {
  it('abre o detalhe pelo cartão e volta para o Estado', async () => {
    const user = userEvent.setup()
    renderAt('/estado')
    const card = await article('Maré alta no fim de semana')
    await user.click(within(card).getByRole('button', { name: /Ver detalhes/ }))
    expect(await heading('Maré alta no fim de semana')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Voltar ao estado/ }))
    expect(await heading('Estado')).toBeInTheDocument()
  })

  it('notícia mostra o texto completo', async () => {
    renderAt('/estado/seed-state-n1')
    expect(
      await heading('Mutirão de limpeza de bueiros chega a mais cidades'),
    ).toBeInTheDocument()
    expect(screen.getByText(/A programação do mutirão foi ampliada/)).toBeInTheDocument()
  })

  it('alerta não oferece agenda, mas pode ser compartilhado', async () => {
    renderAt('/estado/seed-state-a1')
    await heading('Previsão de chuva forte em várias regiões')
    expect(
      screen.queryByRole('button', { name: /Adicionar à agenda/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Compartilhar/ })).toBeInTheDocument()
  })

  it('evento oferece agenda e baixa um .ics com o aviso de demonstração', async () => {
    let blob
    URL.createObjectURL = vi.fn((b) => {
      blob = b
      return 'blob:teste'
    })
    URL.revokeObjectURL = vi.fn()
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const user = userEvent.setup()
    renderAt('/estado/seed-state-e1')
    await heading('Feira de livros, trocas e leitura')

    await user.click(screen.getByRole('button', { name: /Adicionar à agenda/ }))

    expect(click).toHaveBeenCalledTimes(1)
    expect(blob.type).toContain('text/calendar')
    const text = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsText(blob)
    })
    expect(text).toContain('BEGIN:VEVENT')
    expect(text).toContain('SUMMARY:[Demonstração] Feira de livros')
    expect(await screen.findByText(/Arquivo de agenda baixado/)).toBeInTheDocument()
  })

  it('sem menu de compartilhar, copia o link', async () => {
    const user = userEvent.setup() // instala uma área de transferência de teste
    renderAt('/estado/seed-state-n1')
    await heading('Mutirão de limpeza de bueiros chega a mais cidades')
    await user.click(screen.getByRole('button', { name: /Compartilhar/ }))
    expect(await screen.findByText('Link copiado.')).toBeInTheDocument()
    expect(await navigator.clipboard.readText()).toMatch(/\/estado\/seed-state-n1$/)
  })

  it('id desconhecido mostra erro claro', async () => {
    renderAt('/estado/nao-existe')
    expect(await screen.findByText('Conteúdo não encontrado')).toBeInTheDocument()
  })
})
