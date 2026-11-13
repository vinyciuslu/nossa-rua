import { storage } from './storage.js'

/**
 * Relógio do app (D20): por padrão é o horário real. Para demonstrar o ciclo
 * dos relatos sem esperar dias, a pessoa pode "adiantar" o relógio. O adiantamento
 * vale só neste aparelho e fica salvo.
 *
 * É um módulo comum (não React) porque os serviços também precisam da hora.
 * Em um backend de verdade, quem dá a hora é o servidor.
 */
const KEY = 'clock-offset-ms'

let offsetMs = Number(storage.read(KEY, 0)) || 0

export const clock = {
  now: () => new Date(Date.now() + offsetMs),
  getOffset: () => offsetMs,
  advance(ms) {
    offsetMs += ms
    storage.write(KEY, offsetMs)
    return offsetMs
  },
  reset() {
    offsetMs = 0
    storage.remove(KEY)
    return offsetMs
  },
}
