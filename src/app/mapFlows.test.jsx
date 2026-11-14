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
import { goToLocalHour } from '../test/clockHelpers.js'
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

const segmentCards = () => screen.findAllByRole('article')

describe('Mapa: trânsito', () => {
  it('avisa que os dados são simulados e esquemáticos', async () => {
    renderAt('/mapa')
    expect(await screen.findByText('Dados simulados e esquemáticos')).toBeInTheDocument()
    expect(screen.getByText(/não seguem ruas reais/)).toBeInTheDocument()
  })

  it('abre em São Paulo, em "Trânsito", com resumo e trechos marcados como simulados', async () => {
    goToLocalHour(12)
    renderAt('/mapa')
    const cards = await segmentCards()
    expect(cards.length).toBe(10)
    expect(screen.getByRole('button', { name: 'São Paulo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Trânsito' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/Atualizado às/)).toBeInTheDocument()
    for (const card of cards) {
      expect(within(card).getByText(/simulada às/)).toBeInTheDocument()
    }
    expect(screen.getByText(/\d+ trechos? /)).toBeInTheDocument()
  })

  it('no pico da manhã há congestionamento intenso, e o trecho mais grave vem primeiro', async () => {
    goToLocalHour(8)
    renderAt('/mapa')
    const [first] = await segmentCards()
    expect(within(first).getByText('Congestionamento intenso')).toBeInTheDocument()
  })

  it('de madrugada o trânsito está livre', async () => {
    goToLocalHour(3)
    renderAt('/mapa')
    for (const card of await segmentCards()) {
      // (a legenda também cita o nível, por isso a busca é dentro de cada trecho)
      expect(within(card).queryByText('Congestionamento intenso')).not.toBeInTheDocument()
    }
  })

  it('o nível sempre aparece em texto, não só em cor', async () => {
    goToLocalHour(8)
    renderAt('/mapa')
    for (const card of await segmentCards()) {
      expect(
        within(card).getByText(
          /Trânsito livre|Trânsito moderado|Congestionamento intenso|Sem leitura do sensor/,
        ),
      ).toBeInTheDocument()
    }
  })

  it('explica a classificação com os limites de 75% e 40%', async () => {
    renderAt('/mapa')
    await segmentCards()
    const legend = screen.getByRole('region', { name: 'Como classificamos' })
    expect(within(legend).getByText(/a partir de 75%/)).toBeInTheDocument()
    expect(within(legend).getByText(/de 40% a 74%/)).toBeInTheDocument()
    expect(within(legend).getByText(/abaixo de 40%/)).toBeInTheDocument()
  })

  it('troca de município e mostra os trechos de lá', async () => {
    const user = userEvent.setup()
    renderAt('/mapa')
    await segmentCards()
    expect(screen.getByText('Ligação Pinheiros–Centro')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Santos' }))
    expect(await screen.findByText('Ligação Gonzaga–Ponta da Praia')).toBeInTheDocument()
    expect(screen.queryByText('Ligação Pinheiros–Centro')).not.toBeInTheDocument()
  })

  it('moradores de um município com dados já abrem nele', async () => {
    await accounts.signInDemo('resident') // acompanha Pinheiros, em São Paulo
    renderAt('/mapa')
    expect(await screen.findByText('Ligação Pinheiros–Centro')).toBeInTheDocument()
  })
})

describe('Mapa: ônibus', () => {
  async function openBuses() {
    const user = userEvent.setup()
    renderAt('/mapa')
    await segmentCards()
    await user.click(screen.getByRole('button', { name: 'Ônibus' }))
    return user
  }

  it('lista as linhas com os ônibus em operação', async () => {
    goToLocalHour(12)
    await openBuses()
    expect(await screen.findByText('Circular Zona Leste')).toBeInTheDocument()
    expect(screen.getByText('6 ônibus em operação')).toBeInTheDocument()
  })

  it('ao abrir uma linha mostra a previsão de chegada em cada ponto', async () => {
    goToLocalHour(12)
    const user = await openBuses()
    const button = await screen.findByRole('button', {
      name: /Circular Centro e Zona Oeste/,
    })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById(button.getAttribute('aria-controls'))
    for (const stop of [
      'Terminal Central',
      'Ponto Lapa',
      'Ponto Butantã',
      'Ponto Pinheiros',
    ]) {
      expect(within(panel).getByText(stop)).toBeInTheDocument()
    }
    expect(within(panel).getAllByText(/chegando|em \d+ (min|h)/).length).toBeGreaterThan(
      3,
    )
    expect(within(panel).getByText(/Linha circular/)).toBeInTheDocument()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('só uma linha fica aberta por vez', async () => {
    goToLocalHour(12)
    const user = await openBuses()
    const a = await screen.findByRole('button', { name: /Circular Centro e Zona Oeste/ })
    const b = screen.getByRole('button', { name: /Circular Zona Sul/ })
    await user.click(a)
    await user.click(b)
    expect(a).toHaveAttribute('aria-expanded', 'false')
    expect(b).toHaveAttribute('aria-expanded', 'true')
  })

  it('de madrugada diz que está fora do horário e não inventa previsões', async () => {
    goToLocalHour(3)
    const user = await openBuses()
    const button = await screen.findByRole('button', { name: /Circular Zona Sul/ })
    expect(
      within(button).getByText(/Fora do horário \(opera das 5h às 23h30\)/),
    ).toBeInTheDocument()
    await user.click(button)
    const panel = document.getElementById(button.getAttribute('aria-controls'))
    expect(within(panel).getAllByText('Sem previsão agora.')).toHaveLength(5)
  })
})
