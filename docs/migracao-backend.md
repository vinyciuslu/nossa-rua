# Plano de migração para um backend

O protótipo foi escrito para que **só `src/services/` mude**. Este documento lista o que isso significa na prática, com base no código atual. Nada aqui foi implementado.

## 1. Princípio

- `domain/` (regras puras), `components/` e `features/` continuam como estão.
- Cada função de `services/` passa a chamar uma API, mantendo assinatura, formato de retorno e `ServiceError(code, message)` (códigos já usados pelas telas: `not_found`, `forbidden`, `invalid`, `invalid_credentials`, `limit_reached`, `own_post`, `storage_unavailable`).
- TanStack Query já faz cache, estados de carregamento e erro; troca-se apenas a origem dos dados.

## 2. Mapa das funções para endpoints (sugestão)

| Função atual                                          | Endpoint sugerido                               | Observação                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `getSession`, `signIn`, `signOut`                     | `GET /me`, `POST /sessions`, `DELETE /sessions` | Hoje não há senha de cidadão: definir login real (e-mail com link, OTP, gov.br…)                          |
| `signUp`, `updateAccount`                             | `POST /accounts`, `PATCH /accounts/me`          | CPF/CNPJ: decidir se haverá validação oficial; hoje só o dígito verificador, sem guardar                  |
| `signInAdmin`                                         | `POST /admin/sessions`                          | Senha e perfil reais, 2FA, auditoria                                                                      |
| `deleteAccount`                                       | `DELETE /accounts/me`                           | Hoje orquestra 3 serviços no cliente; no servidor deve ser **uma transação**                              |
| `exportAccountData`                                   | `GET /accounts/me/export`                       | Já define o conteúdo mínimo (conta, publicações, apoios, eventos salvos)                                  |
| `listPosts`, `getPost`                                | `GET /posts?neighborhoods=…`, `GET /posts/:id`  | Paginação (hoje devolve tudo); **omitir `authorId`** e `imageId` internos                                 |
| `createReport`, `createCommercialPost`                | `POST /reports`, `POST /commercial-posts`       | Limites comerciais, foto obrigatória por categoria e semelhança passam a ser validados também no servidor |
| `findSimilar`                                         | `GET /reports/similar`                          | Hoje por categoria + bairro + tempo; no servidor pode usar distância real                                 |
| `toggleSupport`                                       | `PUT/DELETE /reports/:id/support`               | Idempotente                                                                                               |
| `getCommercialStatus`                                 | `GET /commercial-posts/quota`                   |                                                                                                           |
| `listPostsByAuthor`                                   | `GET /accounts/me/posts`                        |                                                                                                           |
| `listStateItems`, `getStateItem`                      | `GET /state-feed`, `/state-feed/:id`            | Conteúdo real de fontes oficiais, com origem e licença                                                    |
| `toggleSavedEvent`                                    | `PUT/DELETE /events/:id/saved`                  |                                                                                                           |
| `getMobilitySnapshot`, `listMobilityCities`           | `GET /mobility/:cityId`                         | Sensores e GTFS-realtime reais; hoje simulados em `domain/traffic.js` e `domain/buses.js`                 |
| `listAdminReports`, `getAdminReport`                  | `GET /admin/reports`                            | **Prioridade calculada no servidor** (o cliente só exibe a conta)                                         |
| `updateReportStatus`                                  | `POST /admin/reports/:id/status`                | Regras de transição e nota obrigatória validadas no servidor                                              |
| `listAdminNotices`, `publishNotice`, `retireNotice`   | `/admin/notices`                                | Admin pode retirar qualquer aviso; hoje só os que criou                                                   |
| `updateTrafficThresholds`, `restoreTrafficThresholds` | `PUT /admin/settings/traffic`                   | Limite passa a ser global, não por navegador                                                              |
| `saveImage`, `getImage`, `deleteImages`               | `POST /images`, URLs assinadas                  | **Remover EXIF no servidor** (hoje o cliente faz via canvas); armazenar em bucket                         |

## 3. O que muda de natureza (não é só trocar a chamada)

1. **Funções síncronas viram assíncronas.** `settingsService` (`getTrafficThresholds`, …) e `postService.listAllReports`, `recordAdminStatus`, `addNotice`, `removeNotice`, `exportAccountContent`, `stateService.listSavedEventIds` são síncronas hoje; com rede, todas serão `async` e os chamadores precisam esperar. É a maior alteração mecânica.
2. **Tempo.** O relógio de demonstração (`clock`, `offsetMs` nas chaves do Query) some; o servidor é a fonte de verdade de datas. Remover o `offsetMs` das `queryKey` e a tela de relógio.
3. **Simulações deixam de existir.** Ciclo de status simulado (`statusSimulation`), seed de posts, de estado e de mobilidade e selos "simulado/fictício" dão lugar a dados reais; os selos só continuam onde algo ainda for estimado. A linha do tempo passa a ser só eventos reais (`buildTimeline` simplifica).
4. **Seeds e `seedEpoch`** saem do bundle (reduz tamanho).
5. **Permissões de verdade.** `can()` em `domain/account.js` vira só dica de interface; a autorização é do servidor em todo endpoint, inclusive `requireAdmin`.
6. **Privacidade (LGPD).** Base legal e política de privacidade; retenção e anonimização de relatos de contas excluídas (hoje apaga tudo); consentimento para localização/foto; registro de acesso do painel; o rótulo pseudonimizado do autor deve ser calculado no servidor.
7. **Moderação.** Fila de denúncias de conteúdo, bloqueio de abuso, limite de taxa em criação e apoio (hoje o limite é só por conta, no cliente).
8. **Mapa.** Avaliar contrato do Google Maps (chave por variável de ambiente, já prevista) ou servidor de tiles próprio, para não expor o IP das pessoas a terceiros sem aviso.

## 4. Ordem sugerida

1. Definir o contrato (OpenAPI) a partir da tabela acima e gerar um servidor falso (MSW) que devolve o formato atual; assim o frontend roda contra a "API" antes de existir backend.
2. Tornar tudo `async` no frontend (item 3.1) com o armazenamento local ainda por baixo; testes continuam passando.
3. Autenticação e contas reais.
4. Publicações, apoios e imagens.
5. Painel administrativo e prioridade no servidor.
6. Feed estadual e mobilidade com fontes reais.
7. Remover simulações, seeds e relógio de demonstração.

## 5. Riscos e perguntas em aberto

- Quem é a "administração"? Prefeitura, plataforma, parceiros? Isso define permissões, selos e responsabilidade pelo conteúdo.
- Como evitar que o app pareça canal oficial de órgãos públicos sem ser? (O protótipo resolve com selos de demonstração; o produto real precisa de uma regra clara.)
- Verificação de identidade: sem ela, relatos podem ser forjados em massa; com ela, aumenta a coleta de dados pessoais.
- Custo e licenças de dados de trânsito e ônibus.
- Acessibilidade: repetir a validação em aparelho real a cada mudança grande de interface.
