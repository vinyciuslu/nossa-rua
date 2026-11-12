/**
 * Acesso ao localStorage, num só lugar.
 *
 * - Todas as chaves levam o prefixo "nossa-rua:v1:", então dá para apagar só o
 *   que é do app e trocar de versão sem colidir com dados antigos.
 * - localStorage pode lançar erro (navegação privativa, cota cheia, bloqueio) ou
 *   conter lixo. Por isso toda leitura e escrita é protegida: nesses casos o app
 *   continua funcionando, apenas sem lembrar do que foi gravado.
 */
const PREFIX = 'nossa-rua:v1:'

export const storage = {
  read(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },

  /** Devolve true se gravou. */
  write(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key)
    } catch {
      // sem acesso ao armazenamento: não há o que remover
    }
  },

  /** Apaga somente as chaves do app. */
  clearAll() {
    try {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(PREFIX))
      keys.forEach((k) => window.localStorage.removeItem(k))
    } catch {
      // idem
    }
  },
}
