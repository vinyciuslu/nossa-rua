# Nossa Rua (nome de trabalho)

Plataforma web mobile-first de inteligência urbana colaborativa para moradores do estado de São Paulo: comunidade (relatos, avisos, comércio local), estado (alertas e eventos) e mobilidade (trânsito e ônibus).

> **Protótipo.** Frontend sem backend. Todos os dados são fictícios e simulados, a autenticação será apenas demonstrativa e nada aqui representa ação, alerta ou informação oficial de órgãos públicos.

## Como rodar

Requer Node.js 20.19 ou mais novo. Depois de descompactar, na pasta do projeto:

```bash
npm install
npm run dev        # desenvolvimento (abre em http://localhost:5173)
npm test           # testes (Vitest)
npm run lint       # oxlint (inclui regras de dependência entre módulos)
npm run format     # prettier
npm run build      # build de produção
# build para hospedar em subcaminho, sem controlar a URL (ex.: página incorporada):
VITE_ROUTER=memory APP_BASE=./ npm run build
```

Rotas disponíveis:

| Rota                         | O que é                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `/inicio`, `/publicacao/:id` | Feed da comunidade e detalhe (relatos, avisos, comércio)           |
| `/relatar`, `/anunciar`      | Publicar relato (morador) ou anúncio (comércio)                    |
| `/estado`, `/estado/:id`     | Feed estadual: alertas, notícias e eventos (conteúdo fictício)     |
| `/mapa`                      | Mapa: trânsito (sensores simulados) e ônibus, com listas e mapa    |
| `/entrar`, `/cadastro`       | Entrada e cadastro simulados de morador (CPF) e comércio (CNPJ)    |
| `/acessibilidade`            | Modo de cor e tamanho dos ícones, sem precisar entrar              |
| `/perfil`                    | Perfil e "como você aparece" (exige conta de morador/comércio)     |
| `/perfil/publicacoes`        | Meus relatos (morador) ou Meus anúncios (comércio)                 |
| `/perfil/bairros`            | Bairros acompanhados, com rótulos Casa, Trabalho, Faculdade, Outro |
| `/perfil/configuracoes`      | Acessibilidade, privacidade (simulada), baixar e excluir dados     |
| `/admin/login`, `/admin`     | Acesso administrativo separado e visão geral do painel             |
| `/admin/ocorrencias[/:id]`   | Fila priorizada, filtros e atualização de status (administração)   |
| `/admin/avisos`              | Avisos oficiais por município ou bairro (administração)            |
| `/admin/parametros`          | Limites do trânsito (administração)                                |
| `/dev/design-system`         | Guia de estilo vivo, fora da moldura (revisão de identidade)       |

### Contas de demonstração

Na tela de entrada há botões para entrar como morador(a) ou comércio local sem cadastro. O acesso administrativo usa `admin@demo.nossarua.test` / `demo-admin` (os valores aparecem na própria tela `/admin/login`).

### Privacidade no protótipo

- **CPF/CNPJ:** o número é só validado (dígitos verificadores) no formulário e descartado. Não é gravado, nem em versão codificada (hash). A conta guarda apenas o _tipo_ (`cpf`, `cnpj`, `admin`) e um id interno. O botão "Gerar CPF/CNPJ fictício" evita que alguém digite um documento real.
- **Senha:** não existe senha de cidadão; a conta é identificada pelo e-mail, que fica só neste aparelho. A senha do admin de demonstração é pública e fixa.
- **Autor dos relatos:** por padrão aparece como "Morador(a) de {bairro}". Permissões e privacidade são **simuladas**.
- Dados ficam em `localStorage` (prefixo `nossa-rua:v1:`) e as fotos em IndexedDB, **só neste aparelho**. Em "Configurações" dá para baixar (conta, publicações sem a foto, apoios dados e eventos salvos) ou excluir tudo (conta, publicações, fotos, apoios, eventos salvos e as ações da administração sobre os relatos apagados).
- Fotos passam por um canvas antes de salvar, o que remove os metadados (EXIF), inclusive a localização GPS.
- **O que sai do aparelho:** apenas as imagens de fundo do mapa, pedidas ao OpenStreetMap (que recebe o IP e a região vista; a tela do mapa avisa). Fontes e ícones vêm junto com o app; não há analytics, cookies nem outro serviço externo.
- Quem vê relatos de outras pessoas (inclusive o painel) recebe só o rótulo pseudonimizado do autor; e-mail e nome ficam na conta. O id interno do autor ainda trafega nos dados em memória: com backend, a API precisa omiti-lo.
- Se o navegador bloquear o armazenamento, o app avisa que nada será lembrado.

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
- Excluir a conta apaga também os relatos, anúncios, fotos, apoios e eventos salvos dela.

### Mobilidade (Etapa 5)

- **Rede fictícia e esquemática** (`src/data/seedMobility.js`): São Paulo, Campinas e Santos. Os trechos ligam o centro de dois bairros em linha reta e as linhas passam por "pontos" com o nome do bairro. Nada segue rua real nem usa nome de empresa de ônibus, e a tela avisa isso.
- **Trânsito** (`domain/traffic.js`): cada trecho tem um sensor simulado. A leitura é função pura do horário de São Paulo (picos às 8h e às 18h, fim de semana mais leve) mais ruído com semente, uma vez por minuto; por isso o relógio de demonstração faz o trânsito andar. Classificação pela velocidade como % da normal: **livre a partir de 75%, intenso abaixo de 40%**, moderado entre os dois. Os limites são parâmetros (`classifyTraffic`, `getMobilitySnapshot({ thresholds })`) para a administração ajustar na Etapa 6. Cerca de 5% do tempo o sensor fica "sem leitura" (30 min) e a tela diz isso em vez de inventar um número.
- **Ônibus** (`domain/buses.js`): linhas circulares, operando das 5h às 23h30. O progresso da linha é a soma, de 5 em 5 minutos, da velocidade de cada instante, que depende do trânsito dos trechos dela; assim os ônibus andam de forma contínua e desaceleram nos picos. A previsão de chegada supõe que o trânsito de agora continua.
- **Atualização**: a tela consulta o serviço a cada 15 s (como faria com um backend) e o mapa só redesenha as camadas, sem desfazer o zoom da pessoa.
- **Mapa**: Leaflet + OpenStreetMap, carregado sob demanda (pacote separado de ~150 kB). Os tiles do OpenStreetMap servem para demonstração; um produto real precisa de um provedor de tiles contratado. O **Google Maps não foi implementado**: não dá para testá-lo sem chave e sem rede neste ambiente.
- **Acessibilidade**: as listas (Trânsito e Ônibus) trazem tudo o que o mapa mostra e são a base; o mapa é complementar. O nível de trânsito nunca depende só de cor: o traço muda de padrão (contínuo, tracejado, pontilhado grosso) e há legenda. Marcadores não entram na ordem do Tab. Em tela de toque, um dedo rola a página e dois movem o mapa. Se os tiles não carregarem, a tela avisa e continua útil.

### Feed estadual (Etapa 4)

- **Tudo é fictício, inclusive as instituições.** As fontes ("Central Fictícia de Alertas", "Rede Cultural Fictícia"...) foram inventadas e carregam o selo "Instituição fictícia"; o selo "Fonte institucional verificada" não é usado, porque exigiria integração real. Nenhum alerta deve ser seguido de verdade (`src/data/seedState.js`).
- **Alertas** têm nível (informativo, atenção, urgente) e validade. Depois de expirar viram "Encerrado": somem da visão "Tudo", mas continuam no filtro "Alertas". **Eventos** que já passaram seguem o mesmo princípio ("Já aconteceu").
- As datas são relativas à primeira abertura do app (`services/seedEpoch.js`, compartilhada com os relatos), então o relógio de demonstração faz alertas expirarem e eventos acontecerem.
- **Região**: quem acompanha bairros escolhe entre "Todo o estado" e "Meus municípios" (conteúdo estadual + dos municípios acompanhados). "Salvos" ignora a região.
- **Salvar evento**: contas de morador e de comércio; guardado por conta em `localStorage` e apagado junto com a conta.
- **Adicionar à agenda**: gera um `.ics` no próprio navegador (`domain/ics.js`: CRLF, texto escapado, linhas dobradas em 75 bytes, datas em UTC). O título leva o prefixo "[Demonstração]" para o evento fictício não ser confundido com um compromisso real.
- **Compartilhar**: usa o menu do aparelho (Web Share API) e, onde não existe, copia o link. O link só abre o mesmo conteúdo neste protótipo, pois não há servidor.

`services/` expõe funções assíncronas (com um pequeno atraso simulado). As telas não sabem onde os dados ficam: trocar por um backend muda o conteúdo dos serviços, não as telas. Consultas passam pelo TanStack Query (cache, carregando e erro). Imagens ficam no IndexedDB (`services/imageStore.js`).

### Administração (Etapa 6)

Painel em página larga, sem a moldura de smartphone, só para a conta de administração (`/admin/login`). Tudo continua no navegador: as ações do painel alteram o que os moradores **deste navegador** veem, mas não acionam nenhum órgão público.

- **Fila priorizada** (`domain/priority.js`): o **nível de urgência vem da categoria** do relato (alta 90, média 60, baixa 30) e **sempre vem primeiro**. Dentro do nível, desempatam a espera (em relação a um prazo de referência de 24 h, 72 h ou 7 dias, valores fictícios) e o apoio da comunidade (20 apoios = máximo). Os dois juntos somam no máximo **+15 pontos**; como os níveis distam 30, um relato menos grave nunca passa à frente de um mais grave. A tela de detalhe mostra a conta inteira, sem caixa-preta.
- **Atualização de status** (`domain/reportStatus.js`, `services/adminService.js`): só para frente (Recebida → Em análise → Encaminhamento registrado → Em andamento → Resolvida; "Não procedente" a qualquer momento; etapas puladas aparecem como "não registradas"). "Encaminhamento registrado" e "Não procedente" exigem nota pública (10 a 280 caracteres). Relato encerrado não é reaberto e a espera deixa de contar.
- **Histórico transparente** (`domain/reportTimeline.js`): depois da primeira ação da administração, a simulação automática daquele relato **para**; ficam só os eventos simulados anteriores (marcados "Simulado") e os registrados à mão (marcados como "administração de demonstração", sem selo de simulado). O morador vê tudo na linha do tempo.
- **Avisos oficiais**: nível, título e descrição para um município inteiro ou um bairro. Aparecem na comunidade com a origem "moderação". A administração só retira os avisos que ela mesma criou (os do seed são fixos).
- **Parâmetros**: limites do trânsito (padrão 75% e 40%), validados na tela e no serviço, com "Restaurar padrão". O mapa passa a usar os novos valores.
- **Segurança**: nenhuma de verdade. Login, permissões e dados estão no navegador; o `requireAdmin` do serviço existe para manter o contrato que um backend teria de cumprir.

Limites conhecidos: urgência só pela categoria (sem ajuste manual); prazos de referência fictícios; testado em Chrome com tela larga, 390 px e alto contraste, sem leitor de tela real.

### Acessibilidade e refinamento (Etapa 7)

- **Modos de exibição** (em `/acessibilidade` e Configurações): padrão, vermelho-verde, azul-amarelo e alto contraste; ícones e áreas de toque grandes. Valem para o aparelho, inclusive antes do login.
- **Toque duplo com narração** (opcional, desligado por padrão; `components/a11y/GuidedTap.jsx`): o primeiro toque num botão ou link o descreve em voz alta (SpeechSynthesis, voz do próprio aparelho, pt-BR) e o destaca; o segundo, no mesmo item, ativa. Campos de texto não são bloqueados. Teclado e leitores de tela passam direto (clique sem `detail`), pois o modo **não substitui VoiceOver nem TalkBack**. Sem narração no navegador, o modo avisa e continua pedindo dois toques.
- **Foco e títulos:** ao trocar de tela o foco vai para o conteúdo e a rolagem volta ao topo; cada tela tem um `h1` e níveis coerentes; há link "Pular para o conteúdo" no app e no painel.
- **Desempenho:** telas menos usadas são carregadas sob demanda (`React.lazy`); o pacote inicial ficou em ~430 kB (gzip ~134 kB), e o mapa (Leaflet) só baixa ao abrir o Mapa.
- **Robustez:** `ErrorBoundary` global (tela quebrada ou código que não baixa), 404 com título, carregando/erro/vazio em todas as telas com dados, aviso de armazenamento bloqueado.
- **Verificação:** além dos testes, o axe-core (WCAG 2.1 A/AA e boas práticas) foi rodado em todas as telas nos modos padrão, vermelho-verde e alto contraste, em celular e desktop, com zero violações. É triagem automática: não substitui leitor de tela real nem teste com pessoas.

Documentos de apoio: [`docs/validacao-em-aparelho.md`](docs/validacao-em-aparelho.md) (roteiro para testar em celular e com leitor de tela) e [`docs/migracao-backend.md`](docs/migracao-backend.md) (como trocar a camada de serviços por uma API).

## Limitações conhecidas

- Sem backend: login, permissões e dados são simulados e vivem no navegador (nenhuma segurança real).
- Não foi testado em aparelho físico nem com VoiceOver/TalkBack; o toque duplo precisa de validação com quem vai usá-lo.
- Google Maps não foi implementado (não dá para testar sem chave); o mapa usa Leaflet + OpenStreetMap, e as imagens de fundo nunca foram vistas com ruas no ambiente de desenvolvimento (bloqueadas), apenas o aviso de falha.
- Arquivos `.ics` não foram abertos em um calendário real.
- Administração: não reabre relatos encerrados; urgência só pela categoria; prazos de referência fictícios; só retira avisos criados por ela.
- Fora do escopo da v1: central de notificações e PWA.

## Design system

- Tokens semânticos em `src/index.css` (cores por modo: padrão, vermelho-verde, azul-amarelo, alto contraste; escala de ícones e áreas de toque).
- Componentes usam só nomes semânticos (`bg-surface`, `text-ink`...), nunca cores literais.
- `src/test/themes.test.js` valida o CSS real: contraste WCAG (texto ≥ 4,5:1, elementos gráficos ≥ 3:1) em todos os modos e distinção entre "bom / atenção / ruim" sob simulação de daltonismo. É triagem automática e **não substitui** teste com pessoas.

## Roadmap

1. Fundação
2. Autenticação e perfis
3. Comunidade
4. Feed estadual
5. Mobilidade
6. Administração
7. Refinamento (acessibilidade, desempenho, robustez, privacidade)
