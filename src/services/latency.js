/**
 * Atraso artificial das chamadas de serviço.
 *
 * Um backend de verdade demora; sem isso, estados de "carregando" e botões
 * desativados durante o envio nunca seriam exercitados no protótipo.
 * Nos testes o atraso é zero.
 */
const DEFAULT_MS = import.meta.env.MODE === 'test' ? 0 : 250

export const wait = (ms = DEFAULT_MS) =>
  ms === 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms))
