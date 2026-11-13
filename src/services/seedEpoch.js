import { storage } from './storage.js'

const EPOCH_KEY = 'seed-epoch'

/**
 * Momento em que este aparelho abriu o app pela primeira vez: âncora das datas de
 * todo conteúdo fictício (publicações, alertas, eventos). Fica gravado para o
 * conteúdo envelhecer junto com o relógio de demonstração.
 */
export function seedEpoch() {
  const saved = storage.read(EPOCH_KEY)
  if (typeof saved === 'number') return saved
  const now = Date.now()
  storage.write(EPOCH_KEY, now)
  return now
}
