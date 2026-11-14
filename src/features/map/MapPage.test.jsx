import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryClient } from '../../app/queryClient.js'
import { AccessibilityProvider } from '../../context/AccessibilityContext.jsx'
import { ClockProvider } from '../../context/ClockContext.jsx'
import { SessionProvider } from '../../context/SessionContext.jsx'
import { clock } from '../../services/clock.js'
import { goToLocalHour } from '../../test/clockHelpers.js'
import { MapPage } from './MapPage.jsx'

// O desenho do mapa tem teste próprio (MapView.test.jsx). Aqui o mapa é um
// dublê, para testar o que a PÁGINA entrega a ele e como reage aos avisos dele.
const lastProps = { current: null }
vi.mock('./MapView.jsx', () => ({
  default: (props) => {
    lastProps.current = props
    return (
      <div data-testid="mapa">
        <button type="button" onClick={props.onTilesFailed}>
          simular falha dos tiles
        </button>
        <button type="button" onClick={() => props.onSelectSegment('sao-paulo-s3')}>
          simular toque em trecho
        </button>
      </div>
    )
  },
}))

function renderPage() {
  return render(
    <QueryClientProvider client={createQueryClient({ retry: false, staleTime: 0 })}>
      <AccessibilityProvider>
        <ClockProvider>
          <SessionProvider>
            <MemoryRouter>
              <MapPage />
            </MemoryRouter>
          </SessionProvider>
        </ClockProvider>
      </AccessibilityProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  clock.reset()
  lastProps.current = null
})

describe('MapPage com o mapa', () => {
  it('entrega ao mapa o município, o modo e a legenda do traço', async () => {
    goToLocalHour(12)
    renderPage()
    expect(await screen.findByTestId('mapa')).toBeInTheDocument()
    expect(lastProps.current.snapshot.cityId).toBe('sao-paulo')
    expect(lastProps.current.mode).toBe('traffic')
    expect(screen.getByRole('list', { name: 'Legenda do mapa' })).toBeInTheDocument()
  })

  it('trocar de município e de modo chega ao mapa', async () => {
    goToLocalHour(12)
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('mapa')
    await user.click(screen.getByRole('button', { name: 'Campinas' }))
    await vi.waitFor(() => expect(lastProps.current.snapshot.cityId).toBe('campinas'))
    await user.click(screen.getByRole('button', { name: 'Ônibus' }))
    await vi.waitFor(() => expect(lastProps.current.mode).toBe('bus'))
    expect(
      screen.queryByRole('list', { name: 'Legenda do mapa' }),
    ).not.toBeInTheDocument()
  })

  it('abrir uma linha na lista a destaca no mapa', async () => {
    goToLocalHour(12)
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('mapa')
    await user.click(screen.getByRole('button', { name: 'Ônibus' }))
    await user.click(await screen.findByRole('button', { name: /Circular Zona Sul/ }))
    expect(lastProps.current.selectedLineId).toBe('sao-paulo-l300')
  })

  it('tocar em um trecho do mapa o destaca na lista', async () => {
    goToLocalHour(12)
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('mapa')
    await user.click(screen.getByRole('button', { name: 'simular toque em trecho' }))
    expect(
      await screen.findByRole('button', { name: 'Tirar destaque do mapa' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('se o mapa-base falhar, avisa e mantém as listas', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('mapa')
    expect(screen.queryByText('O mapa-base não carregou')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'simular falha dos tiles' }))
    expect(screen.getByText('O mapa-base não carregou')).toBeInTheDocument()
    expect(screen.getByText('Ligação Pinheiros–Centro')).toBeInTheDocument()
  })
})
