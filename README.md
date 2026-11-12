# Nossa Rua (nome de trabalho)

Plataforma web mobile-first de inteligência urbana colaborativa para moradores do estado de São Paulo: comunidade (relatos, avisos, comércio local), estado (alertas e eventos) e mobilidade (trânsito e ônibus).

> **Protótipo.** Frontend sem backend. Todos os dados são fictícios e simulados, a autenticação será apenas demonstrativa e nada aqui representa ação, alerta ou informação oficial de órgãos públicos.

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento
npm test           # testes (Vitest)
npm run lint       # oxlint (inclui regras de dependência entre módulos)
npm run format     # prettier
npm run build      # build de produção
```

Rotas disponíveis (até a Etapa 2):

| Rota                     | O que é                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `/inicio`                | Início (placeholder honesto, chega na Etapa 3)                     |
| `/estado`                | Estado (placeholder, Etapa 4)                                      |
| `/mapa`                  | Mapa (placeholder, Etapa 5)                                        |
| `/entrar`, `/cadastro`   | Entrada e cadastro simulados de morador (CPF) e comércio (CNPJ)    |
| `/acessibilidade`        | Modo de cor e tamanho dos ícones, sem precisar entrar              |
| `/perfil`                | Perfil e "como você aparece" (exige conta de morador/comércio)     |
| `/perfil/bairros`        | Bairros acompanhados, com rótulos Casa, Trabalho, Faculdade, Outro |
| `/perfil/configuracoes`  | Acessibilidade, privacidade (simulada), baixar e excluir dados     |
| `/admin/login`, `/admin` | Acesso administrativo separado; o painel chega na Etapa 6          |
| `/dev/design-system`     | Guia de estilo vivo, fora da moldura (revisão de identidade)       |

### Contas de demonstração

Na tela de entrada há botões para entrar como morador(a) ou comércio local sem cadastro. O acesso administrativo usa `admin@demo.nossarua.test` / `demo-admin` (os valores aparecem na própria tela `/admin/login`).

### Privacidade no protótipo

- **CPF/CNPJ:** o número é só validado (dígitos verificadores) no formulário e descartado. Não é gravado, nem em versão codificada (hash). A conta guarda apenas o _tipo_ (`cpf`, `cnpj`, `admin`) e um id interno. O botão "Gerar CPF/CNPJ fictício" evita que alguém digite um documento real.
- **Senha:** não existe senha de cidadão; a conta é identificada pelo e-mail, que fica só neste aparelho. A senha do admin de demonstração é pública e fixa.
- **Autor dos relatos:** por padrão aparece como "Morador(a) de {bairro}". Permissões e privacidade são **simuladas**.
- Dados ficam em `localStorage` (prefixo `nossa-rua:v1:`). Em "Configurações" dá para baixar ou excluir tudo.

## Moldura de smartphone

Em janelas com pelo menos 768 px de largura **e** 700 px de altura, o app aparece dentro de um aparelho fictício. Em qualquer tela menor (celular real, tablet em pé pequeno, janela baixa) a moldura desaparece e o app ocupa a tela toda.

## Arquitetura (resumo)

```
src/
├─ app/          composição: rotas e provedores
├─ components/   layout/ (moldura, cabeçalho, navegação, Page), ui/ (componentes), illustrations/
├─ config/       valores ajustáveis (nome do app, modos de cor, contas de demonstração)
├─ context/      contextos transversais (acessibilidade, sessão)
├─ domain/       regras de negócio puras (contas, documentos, bairros, validações Zod)
├─ features/     uma pasta por área do produto (auth, profile, admin, community, state, map, dev)
├─ services/     tudo que toca em armazenamento (localStorage) e simula um backend assíncrono
├─ utils/        funções utilitárias pequenas
└─ test/         apoio dos testes (cores, leitura dos temas)
```

Regras verificadas pelo lint:

- `domain/` não importa React, componentes, features nem serviços.
- Uma feature não importa de outra feature.

`services/` expõe funções assíncronas (com um pequeno atraso simulado). As telas não sabem onde os dados ficam: trocar por um backend muda o conteúdo dos serviços, não as telas. Ainda **não existem**, por falta de necessidade concreta: IndexedDB para imagens, relógio de simulação, dados fictícios (seed) e TanStack Query. Entram na Etapa 3, quando o feed precisar deles.

## Design system

- Tokens semânticos em `src/index.css` (cores por modo: padrão, vermelho-verde, azul-amarelo, alto contraste; escala de ícones e áreas de toque).
- Componentes usam só nomes semânticos (`bg-surface`, `text-ink`...), nunca cores literais.
- `src/test/themes.test.js` valida o CSS real: contraste WCAG (texto ≥ 4,5:1, elementos gráficos ≥ 3:1) em todos os modos e distinção entre "bom / atenção / ruim" sob simulação de daltonismo. É triagem automática e **não substitui** teste com pessoas.

## Roadmap

1. Fundação
2. Autenticação e perfis (esta etapa)
3. Comunidade
4. Feed estadual
5. Mobilidade
6. Administração
7. Refinamento
