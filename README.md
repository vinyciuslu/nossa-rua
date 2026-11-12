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

Rotas disponíveis na Etapa 1:

| Rota                 | O que é                                                      |
| -------------------- | ------------------------------------------------------------ |
| `/inicio`            | Início (placeholder honesto, chega na Etapa 3)               |
| `/estado`            | Estado (placeholder, Etapa 4)                                |
| `/mapa`              | Mapa (placeholder, Etapa 5)                                  |
| `/perfil`            | Perfil (placeholder, Etapa 2)                                |
| `/dev/design-system` | Guia de estilo vivo, fora da moldura (revisão de identidade) |

## Moldura de smartphone

Em janelas com pelo menos 768 px de largura **e** 700 px de altura, o app aparece dentro de um aparelho fictício. Em qualquer tela menor (celular real, tablet em pé pequeno, janela baixa) a moldura desaparece e o app ocupa a tela toda.

## Arquitetura (resumo)

```
src/
├─ app/          composição: rotas e provedores
├─ components/   layout/ (moldura, cabeçalho, navegação), ui/ (componentes), illustrations/
├─ config/       valores ajustáveis (nome do app, modos de cor)
├─ context/      contextos transversais (acessibilidade; sessão na Etapa 2)
├─ domain/       regras de negócio puras (sem React, sem I/O)
├─ features/     uma pasta por área do produto (community, state, map, profile, dev)
├─ utils/        funções utilitárias pequenas
└─ test/         apoio dos testes (cores, leitura dos temas)
```

Regras verificadas pelo lint:

- `domain/` não importa React, componentes, features nem serviços.
- Uma feature não importa de outra feature.

As camadas de serviços, persistência (localStorage + IndexedDB), relógio de simulação e dados fictícios **ainda não existem**: entram na primeira etapa que realmente precisa delas (ver roadmap).

## Design system

- Tokens semânticos em `src/index.css` (cores por modo: padrão, vermelho-verde, azul-amarelo, alto contraste; escala de ícones e áreas de toque).
- Componentes usam só nomes semânticos (`bg-surface`, `text-ink`...), nunca cores literais.
- `src/test/themes.test.js` valida o CSS real: contraste WCAG (texto ≥ 4,5:1, elementos gráficos ≥ 3:1) em todos os modos e distinção entre "bom / atenção / ruim" sob simulação de daltonismo. É triagem automática e **não substitui** teste com pessoas.

## Roadmap

1. Fundação (esta etapa)
2. Autenticação e perfis
3. Comunidade
4. Feed estadual
5. Mobilidade
6. Administração
7. Refinamento
