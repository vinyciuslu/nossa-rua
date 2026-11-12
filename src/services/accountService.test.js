import { describe, expect, it } from 'vitest'
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD } from '../config/demoAccounts.js'
import * as accounts from './accountService.js'
import { storage } from './storage.js'

const resident = {
  type: 'cpf',
  name: ' Ana Souza ',
  email: ' Ana@Exemplo.com ',
  businessName: '',
  neighborhoodId: 'sao-paulo/pinheiros',
}

describe('cadastro', () => {
  it('cria a conta, normaliza o e-mail, acompanha o bairro como "Casa" e abre a sessão', async () => {
    const account = await accounts.signUp(resident)
    expect(account).toMatchObject({
      type: 'cpf',
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      followedPlaces: [{ neighborhoodId: 'sao-paulo/pinheiros', label: 'Casa' }],
      privacy: { authorDisplay: 'neighborhood' },
    })
    expect(account.id).toMatch(/^acc_/)
    expect(await accounts.getSession()).toEqual(account)
  })

  it('conta de comércio começa acompanhando o bairro como "Trabalho"', async () => {
    const account = await accounts.signUp({
      ...resident,
      type: 'cnpj',
      businessName: 'Padaria Exemplo',
    })
    expect(account.followedPlaces[0].label).toBe('Trabalho')
  })

  it('não guarda documento algum, nem senha', async () => {
    // Mesmo que o formulário passasse o documento por engano, o serviço o descarta.
    await accounts.signUp({ ...resident, document: '529.982.247-25', password: 'x' })
    const raw = JSON.stringify(window.localStorage)
    expect(raw).not.toMatch(/529/)
    expect(raw).not.toMatch(/document|password/i)
  })

  it('recusa e-mail repetido, sem diferenciar maiúsculas', async () => {
    await accounts.signUp(resident)
    await expect(
      accounts.signUp({ ...resident, email: 'ANA@exemplo.com' }),
    ).rejects.toMatchObject({ code: 'email_taken' })
  })

  it('recusa tipo de conta inválido (admin não se cadastra)', async () => {
    await expect(accounts.signUp({ ...resident, type: 'admin' })).rejects.toMatchObject({
      code: 'invalid_type',
    })
  })
})

describe('entrada e saída', () => {
  it('entra pelo e-mail e encerra a sessão ao sair', async () => {
    await accounts.signUp(resident)
    await accounts.signOut()
    expect(await accounts.getSession()).toBeNull()
    const account = await accounts.signIn({ email: 'ANA@exemplo.com' })
    expect(account.name).toBe('Ana Souza')
    expect(await accounts.getSession()).toEqual(account)
  })

  it('e-mail desconhecido: erro com orientação', async () => {
    await expect(accounts.signIn({ email: 'x@y.com' })).rejects.toMatchObject({
      code: 'not_found',
    })
  })

  it('conta de demonstração é criada na primeira vez e reaproveitada depois', async () => {
    const first = await accounts.signInDemo('resident')
    await accounts.signOut()
    const second = await accounts.signInDemo('resident')
    expect(first.id).toBe(DEMO_ACCOUNTS.resident.id)
    expect(second.createdAt).toBe(first.createdAt)
    expect(first.demo).toBe(true)
    expect((await accounts.signInDemo('business')).type).toBe('cnpj')
  })

  it('sessão que aponta para conta inexistente é descartada', async () => {
    storage.write('session', { accountId: 'acc_fantasma' })
    expect(await accounts.getSession()).toBeNull()
    expect(storage.read('session')).toBeNull()
  })
})

describe('acesso administrativo (separado)', () => {
  it('aceita só o e-mail e a senha de demonstração', async () => {
    await expect(
      accounts.signInAdmin({ email: DEMO_ACCOUNTS.admin.email, password: 'errada' }),
    ).rejects.toMatchObject({ code: 'invalid_credentials' })

    const admin = await accounts.signInAdmin({
      email: DEMO_ACCOUNTS.admin.email,
      password: DEMO_ADMIN_PASSWORD,
    })
    expect(admin.type).toBe('admin')
    expect(admin.followedPlaces).toEqual([])
  })

  it('o login comum não serve para administrador', async () => {
    await accounts.signInAdmin({
      email: DEMO_ACCOUNTS.admin.email,
      password: DEMO_ADMIN_PASSWORD,
    })
    await accounts.signOut()
    await expect(
      accounts.signIn({ email: DEMO_ACCOUNTS.admin.email }),
    ).rejects.toMatchObject({ code: 'use_admin_access' })
  })
})

describe('perfil', () => {
  it('atualiza só campos editáveis; id, tipo e e-mail não mudam', async () => {
    const account = await accounts.signUp(resident)
    const updated = await accounts.updateAccount(account.id, {
      name: 'Ana Lima',
      privacy: { authorDisplay: 'first_name' },
      type: 'admin',
      email: 'outro@x.com',
      id: 'acc_outro',
    })
    expect(updated).toMatchObject({
      id: account.id,
      type: 'cpf',
      email: 'ana@exemplo.com',
      name: 'Ana Lima',
      privacy: { authorDisplay: 'first_name' },
    })
    expect((await accounts.getSession()).name).toBe('Ana Lima')
  })

  it('exclui a conta e encerra a sessão', async () => {
    const account = await accounts.signUp(resident)
    await accounts.deleteAccount(account.id)
    expect(await accounts.getSession()).toBeNull()
    await expect(accounts.signIn({ email: resident.email })).rejects.toMatchObject({
      code: 'not_found',
    })
  })

  it('exporta os dados da conta', async () => {
    const account = await accounts.signUp(resident)
    const data = await accounts.exportAccountData(account.id)
    expect(data.account.email).toBe('ana@exemplo.com')
    expect(data.note).toMatch(/Nenhum CPF\/CNPJ/)
  })
})

describe('armazenamento indisponível', () => {
  it('avisa com mensagem clara em vez de falhar em silêncio', async () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('cheio', 'QuotaExceededError')
    }
    try {
      await expect(accounts.signUp(resident)).rejects.toMatchObject({
        code: 'storage_unavailable',
      })
    } finally {
      Storage.prototype.setItem = original
    }
  })
})
