/**
 * Categorias de relato.
 *
 * - `illustration`: ilustração de reserva usada enquanto o relato não tem foto.
 * - `photoRequired` (D9): a foto só é obrigatória onde ajuda a comprovar a
 *   ocorrência e dura tempo suficiente para ser fotografada. Poste apagado (à
 *   noite, a foto sai escura), alagamento (passa em horas) e semáforo (difícil
 *   de mostrar) ficam com foto opcional.
 */
export const REPORT_CATEGORIES = [
  { id: 'road', label: 'Buraco ou pavimento', illustration: 'road', photoRequired: true },
  {
    id: 'lighting',
    label: 'Iluminação pública',
    illustration: 'lighting',
    photoRequired: false,
  },
  {
    id: 'cleaning',
    label: 'Limpeza e lixo',
    illustration: 'cleaning',
    photoRequired: true,
  },
  { id: 'tree', label: 'Árvore', illustration: 'tree', photoRequired: true },
  {
    id: 'flooding',
    label: 'Alagamento e bueiro',
    illustration: 'generic',
    photoRequired: false,
  },
  {
    id: 'signal',
    label: 'Semáforo e sinalização',
    illustration: 'generic',
    photoRequired: false,
  },
  { id: 'sidewalk', label: 'Calçada', illustration: 'generic', photoRequired: true },
]

export function getCategory(id) {
  return REPORT_CATEGORIES.find((c) => c.id === id) ?? REPORT_CATEGORIES[0]
}

export const isKnownCategory = (id) => REPORT_CATEGORIES.some((c) => c.id === id)
