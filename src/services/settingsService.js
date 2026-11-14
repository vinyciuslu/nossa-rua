import { DEFAULT_THRESHOLDS, validateThresholds } from '../domain/traffic.js'
import { storage } from './storage.js'

/**
 * Parâmetros do app ajustáveis pela administração (hoje: limites do trânsito).
 * Ficam neste aparelho, como todo o resto do protótipo.
 */

const THRESHOLDS_KEY = 'traffic-thresholds'

/** Limites em uso. Valor salvo inválido (dado antigo ou editado à mão) é ignorado. */
export function getTrafficThresholds() {
  const saved = storage.read(THRESHOLDS_KEY, null)
  if (saved && validateThresholds(saved) === null) {
    return { freeFrom: saved.freeFrom, heavyBelow: saved.heavyBelow }
  }
  return DEFAULT_THRESHOLDS
}

/** Devolve a mensagem de erro, ou null se salvou. */
export function saveTrafficThresholds({ freeFrom, heavyBelow }) {
  const error = validateThresholds({ freeFrom, heavyBelow })
  if (error) return error
  return storage.write(THRESHOLDS_KEY, { freeFrom, heavyBelow })
    ? null
    : 'Não foi possível salvar neste aparelho.'
}

export function resetTrafficThresholds() {
  storage.remove(THRESHOLDS_KEY)
}
