import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccessibilityProvider } from '../../context/AccessibilityContext.jsx'
import { SessionProvider } from '../../context/SessionContext.jsx'
import { signInDemo } from '../../services/accountService.js'
import { AppShell } from './AppShell.jsx'
import { PhoneFrame } from './PhoneFrame.jsx'

function renderApp(path = '/inicio') {
  return render(
    <AccessibilityProvider>
      <SessionProvider>
        <MemoryRouter initialEntries={[path]}>
          <PhoneFrame>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="inicio" element={<p>Tela Início</p>} />
                <Route path="estado" element={<p>Tela Estado</p>} />
                <Route path="mapa" element={<p>Tela Mapa</p>} />
                <Route path="perfil" element={<p>Tela Perfil</p>} />
              </Route>
            </Routes>
          </PhoneFrame>
        </MemoryRouter>
      </SessionProvider>
    </AccessibilityProvider>,
  )
}

describe('AppShell + navegação', () => {
  it('tem landmarks, três abas com texto e a aba atual marcada', () => {
    renderApp('/estado')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Início', 'Estado', 'Mapa'])
    expect(within(nav).getByRole('link', { name: 'Estado' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Mapa' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('navega entre as abas', async () => {
    const user = userEvent.setup()
    renderApp('/inicio')
    expect(screen.getByText('Tela Início')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Mapa' }))
    expect(screen.getByText('Tela Mapa')).toBeInTheDocument()
  })

  it('visitante vê "Entrar" no cabeçalho, que leva a /perfil (a guarda decide o resto)', async () => {
    const user = userEvent.setup()
    renderApp('/inicio')
    await user.click(screen.getByRole('link', { name: 'Entrar' }))
    expect(screen.getByText('Tela Perfil')).toBeInTheDocument()
  })

  it('quem entrou vê as iniciais e o link "Meu perfil"', async () => {
    await signInDemo('resident')
    renderApp('/inicio')
    const link = await screen.findByRole('link', { name: 'Meu perfil' })
    expect(link).toHaveTextContent('MD')
  })

  it('oferece link para pular ao conteúdo principal', () => {
    renderApp()
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute(
      'href',
      '#conteudo',
    )
  })
})
