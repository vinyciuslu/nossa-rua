/**
 * Contas de demonstração, para testar o app sem cadastro.
 * Os valores são públicos de propósito: é um protótipo, e nada aqui protege
 * dados reais. O acesso administrativo usa e-mail e senha fixos, mostrados na
 * própria tela /admin/login.
 */
export const DEMO_ACCOUNTS = {
  resident: {
    id: 'acc_demo_morador',
    type: 'cpf',
    name: 'Marina Demo',
    email: 'morador@demo.nossarua.test',
    neighborhoodId: 'sao-paulo/pinheiros',
  },
  business: {
    id: 'acc_demo_comercio',
    type: 'cnpj',
    name: 'Rafael Demo',
    businessName: 'Padaria Exemplo',
    email: 'comercio@demo.nossarua.test',
    neighborhoodId: 'sao-paulo/vila-mariana',
  },
  admin: {
    id: 'acc_demo_admin',
    type: 'admin',
    name: 'Equipe de moderação (demo)',
    email: 'admin@demo.nossarua.test',
  },
}

export const DEMO_ADMIN_PASSWORD = 'demo-admin'
