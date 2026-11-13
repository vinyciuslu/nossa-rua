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

### Dados simulados e tempo

- Todo conteúdo do feed é fictício e genérico (sem ruas, empresas ou ocorrências reais), gerado por bairro com semente fixa (`src/data/seedPosts.js`): mesmo bairro, mesmas publicações.
- O ciclo de status dos relatos é **simulado** a partir do id do relato (`domain/statusSimulation.js`) e revelado com o passar do tempo. Cada etapa gerada traz o selo "Atualização simulada", e algumas terminam sem resolução ou pulam etapas, para o acompanhamento ser honesto.
- O **relógio de demonstração** (Configurações) adianta o tempo só neste aparelho, para ver o ciclo andar sem esperar dias.
- Apoios ficam em `localStorage`. Só contas de morador apoiam relatos, e ninguém apoia o próprio relato.
- **Fotos** ficam no IndexedDB (o `localStorage` não comporta arquivos). Antes de salvar, a foto é redesenhada em um canvas e gravada como JPEG de no máximo 1280 px: isso reduz o tamanho, corrige a rotação da câmera e **remove os metadados, inclusive o GPS**. A foto só é obrigatória onde ajuda a comprovar o problema (buraco, lixo, árvore, calçada).
- **Relatos parecidos** (`domain/similarity.js`): ao escrever, a pessoa vê relatos abertos, da mesma categoria e bairro, dos últimos 30 dias, que repetem pelo menos 2 das suas palavras (e metade delas). Regra simples e explicável, sem IA; serve para apoiar em vez de duplicar.
- **Anúncios**: no máximo 2 a cada 7 dias por conta e só em bairros do município do comércio (`domain/commercialLimits.js`).
- Excluir a conta apaga também os relatos, anúncios, fotos e apoios dela.

`services/` expõe funções assíncronas (com um pequeno atraso simulado). As telas não sabem onde os dados ficam: trocar por um backend muda o conteúdo dos serviços, não as telas. Consultas passam pelo TanStack Query (cache, carregando e erro). Imagens ficam no IndexedDB (`services/imageStore.js`).

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
