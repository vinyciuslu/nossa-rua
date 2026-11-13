import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD } from '../config/demoAccounts.js'
import { QueryClientProvider } from '@tanstack/react-query'
import { ClockProvider } from '../context/ClockContext.jsx'
import { AccessibilityProvider } from '../context/AccessibilityContext.jsx'
import { SessionProvider } from '../context/SessionContext.jsx'
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

const heading = (name) => screen.findByRole('heading', { level: 1, name })

const profileMenu = () => screen.getByRole('navigation', { name: 'Seções do perfil' })

async function signInAsDemo(user, label = 'Entrar como morador(a)') {
  await user.click(await screen.findByRole('button', { name: label }))
  await heading('Meu perfil')
}

describe('guardas de rota', () => {
  it('visitante em /perfil é levado para Entrar', async () => {
    renderAt('/perfil')
    expect(await heading('Entrar')).toBeInTheDocument()
  })

  it('depois do login, volta para a tela que o visitante tentou abrir', async () => {
    const user = userEvent.setup()
    renderAt('/perfil/bairros')
    await user.click(
      await screen.findByRole('button', { name: 'Entrar como morador(a)' }),
    )
    expect(await heading('Bairros acompanhados')).toBeInTheDocument()
  })

  it('quem já entrou não vê Entrar nem Cadastro: vai para o perfil', async () => {
    const user = userEvent.setup()
    renderAt('/entrar')
    await signInAsDemo(user)
    // navegar de novo para /entrar não é possível pela interface; o link de cabeçalho vai ao perfil
    expect(screen.getByRole('link', { name: 'Meu perfil' })).toBeInTheDocument()
  })

  it('a sessão sobrevive a recarregar a página', async () => {
    const user = userEvent.setup()
    const first = renderAt('/entrar')
    await signInAsDemo(user)
    first.unmount()

    renderAt('/perfil')
    expect(await heading('Meu perfil')).toBeInTheDocument()
    expect(screen.getByText('Marina Demo')).toBeInTheDocument()
  })

  it('morador não entra no painel administrativo', async () => {
    const user = userEvent.setup()
    const first = renderAt('/entrar')
    await signInAsDemo(user)
    first.unmount()

    renderAt('/admin')
    expect(await heading('Acesso administrativo')).toBeInTheDocument()
  })
})

describe('cadastro', () => {
  async function fillCommon(user, { email = 'ana@exemplo.com' } = {}) {
    await user.type(await screen.findByLabelText(/^Nome/), 'Ana Souza')
    await user.type(screen.getByLabelText(/^E-mail/), email)
    await user.selectOptions(screen.getByLabelText(/^Município/), 'São Paulo')
    await user.selectOptions(screen.getByLabelText(/^Bairro/), 'Pinheiros')
    await user.click(screen.getByRole('button', { name: 'Gerar CPF fictício' }))
    await user.click(screen.getByLabelText(/Entendo que é um protótipo/))
  }

  it('mostra todos os erros ao enviar vazio, cada um ligado ao seu campo', async () => {
    const user = userEvent.setup()
    renderAt('/cadastro')
    await user.click(await screen.findByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText(/Informe seu nome/)).toBeInTheDocument()
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText(/CPF inválido/)).toBeInTheDocument()
    expect(screen.getByText('Escolha o município e o bairro.')).toBeInTheDocument()
    expect(screen.getByText(/concordar para criar/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^E-mail/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('cria a conta de morador sem guardar o CPF e abre o perfil', async () => {
    const user = userEvent.setup()
    renderAt('/cadastro')
    await fillCommon(user)

    const cpf = screen.getByLabelText(/^CPF fictício/).value
    expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await heading('Meu perfil')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Morador(a) de Pinheiros')).toBeInTheDocument()

    const stored = JSON.stringify(window.localStorage)
    expect(stored).not.toContain(cpf)
    expect(stored).not.toContain(cpf.replace(/\D/g, ''))
  })

  it('conta de comércio pede nome do comércio e usa CNPJ', async () => {
    const user = userEvent.setup()
    renderAt('/cadastro')
    await user.click(await screen.findByLabelText(/Comércio local/))
    expect(screen.getByLabelText(/^Nome do comércio/)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Nome do responsável/), 'Rafael Lima')
    await user.type(screen.getByLabelText(/^Nome do comércio/), 'Padaria Exemplo')
    await user.type(screen.getByLabelText(/^E-mail/), 'padaria@exemplo.com')
    await user.selectOptions(screen.getByLabelText(/^Município/), 'Campinas')
    await user.selectOptions(screen.getByLabelText(/^Bairro/), 'Cambuí')
    await user.click(screen.getByRole('button', { name: 'Gerar CNPJ fictício' }))
    expect(screen.getByLabelText(/^CNPJ fictício/).value).toMatch(
      /^\d{2}\.\d{3}\.\d{3}\/0001-\d{2}$/,
    )
    await user.click(screen.getByLabelText(/Entendo que é um protótipo/))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await heading('Meu perfil')).toBeInTheDocument()
    expect(screen.getByText('Comércio local')).toBeInTheDocument()
    expect(screen.getByText('Padaria Exemplo')).toBeInTheDocument() // "Como você aparece"
  })

  it('e-mail já usado aparece como erro do formulário', async () => {
    const user = userEvent.setup()
    const first = renderAt('/cadastro')
    await fillCommon(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    await heading('Meu perfil')
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    await heading('Entrar')
    first.unmount()

    renderAt('/cadastro')
    await fillCommon(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    const alert = await screen.findByText(/Já existe uma conta com esse e-mail/)
    expect(alert).toBeInTheDocument()
  })
})

describe('login', () => {
  it('e-mail inexistente mostra orientação; e-mail inválido é barrado antes', async () => {
    const user = userEvent.setup()
    renderAt('/entrar')
    await user.type(await screen.findByLabelText('E-mail'), 'sem-arroba')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText(/e-mail válido/)).toBeInTheDocument()

    await user.clear(screen.getByLabelText('E-mail'))
    await user.type(screen.getByLabelText('E-mail'), 'ninguem@exemplo.com')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText(/Não encontramos uma conta/)).toBeInTheDocument()
  })

  it('a tela de entrada avisa que é protótipo e que não há senha', async () => {
    renderAt('/entrar')
    expect(await screen.findByText(/Não existe senha/)).toBeInTheDocument()
  })
})

describe('acesso administrativo', () => {
  it('senha errada é recusada; senha de demonstração abre o painel; sair volta ao login', async () => {
    const user = userEvent.setup()
    renderAt('/admin')
    await heading('Acesso administrativo')

    await user.type(screen.getByLabelText('E-mail'), DEMO_ACCOUNTS.admin.email)
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Senha'))
    await user.type(screen.getByLabelText('Senha'), DEMO_ADMIN_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await heading('Painel administrativo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await heading('Acesso administrativo')).toBeInTheDocument()
  })

  it('administrador que abre /perfil é levado ao painel', async () => {
    const user = userEvent.setup()
    const first = renderAt('/admin/login')
    await user.type(await screen.findByLabelText('E-mail'), DEMO_ACCOUNTS.admin.email)
    await user.type(screen.getByLabelText('Senha'), DEMO_ADMIN_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await heading('Painel administrativo')
    first.unmount()

    renderAt('/perfil')
    expect(await heading('Painel administrativo')).toBeInTheDocument()
  })
})

describe('bairros acompanhados', () => {
  it('mostra o bairro inicial como Casa, adiciona com rótulo e remove', async () => {
    const user = userEvent.setup()
    renderAt('/entrar')
    await signInAsDemo(user)
    await user.click(
      within(profileMenu()).getByRole('link', { name: /Bairros acompanhados/ }),
    )
    await heading('Bairros acompanhados')

    expect(screen.getByText('Seus bairros (1 de 5)')).toBeInTheDocument()
    expect(screen.getByLabelText('Rótulo de Pinheiros · São Paulo')).toHaveValue('Casa')

    await user.selectOptions(screen.getByLabelText(/^Município/), 'Santos')
    await user.selectOptions(screen.getByLabelText(/^Bairro/), 'Gonzaga')
    await user.selectOptions(screen.getByLabelText(/^Rótulo$/), 'Trabalho')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(await screen.findByText('Seus bairros (2 de 5)')).toBeInTheDocument()
    expect(screen.getByLabelText('Rótulo de Gonzaga · Santos')).toHaveValue('Trabalho')

    await user.click(screen.getByRole('button', { name: 'Remover Gonzaga · Santos' }))
    expect(await screen.findByText('Seus bairros (1 de 5)')).toBeInTheDocument()
  })

  it('recusa rótulo "Casa" repetido, explicando o motivo', async () => {
    const user = userEvent.setup()
    renderAt('/entrar')
    await signInAsDemo(user)
    await user.click(
      within(profileMenu()).getByRole('link', { name: /Bairros acompanhados/ }),
    )
    await heading('Bairros acompanhados')

    await user.selectOptions(screen.getByLabelText(/^Município/), 'Santos')
    await user.selectOptions(screen.getByLabelText(/^Bairro/), 'Gonzaga')
    await user.selectOptions(screen.getByLabelText(/^Rótulo$/), 'Casa')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(
      await screen.findByText(/já tem um bairro com o rótulo "Casa"/),
    ).toBeInTheDocument()
    expect(screen.getByText('Seus bairros (1 de 5)')).toBeInTheDocument()
  })

  it('as escolhas ficam salvas ao recarregar', async () => {
    const user = userEvent.setup()
    const first = renderAt('/entrar')
    await signInAsDemo(user)
    await user.click(
      within(profileMenu()).getByRole('link', { name: /Bairros acompanhados/ }),
    )
    await user.selectOptions(
      await screen.findByLabelText(/^Rótulo de Pinheiros/),
      'Faculdade',
    )
    await screen.findByText('Rótulo atualizado')
    first.unmount()

    renderAt('/perfil/bairros')
    expect(await screen.findByLabelText(/^Rótulo de Pinheiros/)).toHaveValue('Faculdade')
  })
})

describe('configurações', () => {
  it('privacidade: troca como o nome aparece e mostra no perfil', async () => {
    const user = userEvent.setup()
    renderAt('/entrar')
    await signInAsDemo(user)
    expect(screen.getByText('Morador(a) de Pinheiros')).toBeInTheDocument()

    await user.click(within(profileMenu()).getByRole('link', { name: /Configurações/ }))
    await heading('Configurações')
    await user.click(screen.getByLabelText(/Primeiro nome e bairro/))
    await screen.findByText('Privacidade atualizada')
    expect(screen.getByText(/apenas simuladas/)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Voltar ao perfil' }))
    expect(await screen.findByText('Marina · Pinheiros')).toBeInTheDocument()
  })

  it('acessibilidade: o modo de cor é aplicado e lembrado', async () => {
    const user = userEvent.setup()
    renderAt('/acessibilidade')
    await user.click(await screen.findByRole('button', { name: 'Alto contraste' }))
    expect(document.documentElement.dataset.colorMode).toBe('high-contrast')
    await user.click(screen.getByRole('button', { name: 'Grande' }))
    expect(document.documentElement.dataset.iconSize).toBe('large')
    expect(JSON.parse(window.localStorage.getItem('nossa-rua:v1:accessibility'))).toEqual(
      {
        colorMode: 'high-contrast',
        largeIcons: true,
      },
    )
  })

  it('excluir a conta pede confirmação, apaga e volta para Entrar', async () => {
    const user = userEvent.setup()
    renderAt('/entrar')
    await signInAsDemo(user)
    await user.click(within(profileMenu()).getByRole('link', { name: /Configurações/ }))
    await heading('Configurações')

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    const dialog = await screen.findByRole('dialog', { name: 'Excluir sua conta?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Sim, excluir minha conta',
      }),
    )
    expect(await heading('Entrar')).toBeInTheDocument()
    expect(window.localStorage.getItem('nossa-rua:v1:session')).toBeNull()
  })

  it('baixar meus dados gera um arquivo JSON sem documento', async () => {
    const user = userEvent.setup()
    URL.createObjectURL = vi.fn(() => 'blob:teste')
    URL.revokeObjectURL = vi.fn()
    renderAt('/entrar')
    await signInAsDemo(user)
    await user.click(within(profileMenu()).getByRole('link', { name: /Configurações/ }))
    await heading('Configurações')
    await user.click(screen.getByRole('button', { name: 'Baixar meus dados' }))
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1))
    const blob = URL.createObjectURL.mock.calls[0][0]
    const text = await blob.text()
    expect(JSON.parse(text).account.email).toBe(DEMO_ACCOUNTS.resident.email)
    expect(text).not.toMatch(/cpf":|document/i)
  })
})
