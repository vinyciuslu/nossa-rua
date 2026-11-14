/**
 * Categorias de relato.
 *
 * - `illustration`: ilustração de reserva usada enquanto o relato não tem foto.
 * - `urgency`: gravidade típica (high | medium | low), ponto de partida da fila de
 *   prioridade da administração (ver priority.js). Risco de queda, de acidente ou de
 *   alagamento vem antes de incômodo.
 * - `photoRequired` (D9): a foto só é obrigatória onde ajuda a comprovar a
 *   ocorrência e dura tempo suficiente para ser fotografada. Poste apagado (à
 *   noite, a foto sai escura), alagamento (passa em horas) e semáforo (difícil
 *   de mostrar) ficam com foto opcional.
 */
export const REPORT_CATEGORIES = [
  {
    id: 'road',
    urgency: 'medium',
    label: 'Buraco ou pavimento',
    illustration: 'road',
    photoRequired: true,
  },
  {
    id: 'lighting',
    urgency: 'medium',
    label: 'Iluminação pública',
    illustration: 'lighting',
    photoRequired: false,
  },
  {
    id: 'cleaning',
    urgency: 'low',
    label: 'Limpeza e lixo',
    illustration: 'cleaning',
    photoRequired: true,
  },
  {
    id: 'tree',
    urgency: 'high',
    label: 'Árvore',
    illustration: 'tree',
    photoRequired: true,
  },
  {
    id: 'flooding',
    urgency: 'high',
    label: 'Alagamento e bueiro',
    illustration: 'generic',
    photoRequired: false,
  },
  {
    id: 'signal',
    urgency: 'high',
    label: 'Semáforo e sinalização',
    illustration: 'generic',
    photoRequired: false,
  },
  {
    id: 'sidewalk',
    urgency: 'medium',
    label: 'Calçada',
    illustration: 'generic',
    photoRequired: true,
  },
]

export function getCategory(id) {
  return REPORT_CATEGORIES.find((c) => c.id === id) ?? REPORT_CATEGORIES[0]
}

export const isKnownCategory = (id) => REPORT_CATEGORIES.some((c) => c.id === id)
