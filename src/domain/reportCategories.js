/**
 * Categorias de relato. `illustration` escolhe a ilustração de reserva usada
 * enquanto um relato não tem foto (ver CategoryIllustration).
 */
export const REPORT_CATEGORIES = [
  { id: 'road', label: 'Buraco ou pavimento', illustration: 'road' },
  { id: 'lighting', label: 'Iluminação pública', illustration: 'lighting' },
  { id: 'cleaning', label: 'Limpeza e lixo', illustration: 'cleaning' },
  { id: 'tree', label: 'Árvore', illustration: 'tree' },
  { id: 'flooding', label: 'Alagamento e bueiro', illustration: 'generic' },
  { id: 'signal', label: 'Semáforo e sinalização', illustration: 'generic' },
  { id: 'sidewalk', label: 'Calçada', illustration: 'generic' },
]

export function getCategory(id) {
  return REPORT_CATEGORIES.find((c) => c.id === id) ?? REPORT_CATEGORIES[0]
}
