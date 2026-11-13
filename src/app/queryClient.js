import { QueryClient } from '@tanstack/react-query'

/**
 * Cliente do TanStack Query: guarda em cache o que os serviços devolvem e cuida de
 * carregando/erro/atualização. Escolhas deliberadamente simples:
 *  - dados valem 30 s antes de serem considerados velhos;
 *  - não refaz a consulta só porque a janela ganhou foco (é um protótipo local).
 */
export function createQueryClient(overrides = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false, ...overrides },
    },
  })
}
