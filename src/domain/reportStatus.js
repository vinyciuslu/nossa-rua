/**
 * Ciclo de vida de um relato (denúncia) de morador.
 *
 * Estes estados descrevem o que acontece DENTRO da plataforma. Nesta versão, quem
 * atualiza o status é a moderação de demonstração, e nada disso representa ação de
 * órgãos públicos. A interface sempre deixa isso claro (ver StatusTimeline).
 */
export const REPORT_STATUSES = [
  {
    id: 'received',
    label: 'Recebida',
    description: 'O relato foi publicado e registrado na plataforma.',
  },
  {
    id: 'in_review',
    label: 'Em análise',
    description: 'A moderação está conferindo as informações do relato.',
  },
  {
    id: 'forwarded',
    label: 'Encaminhamento registrado',
    description:
      'Foi registrado um encaminhamento do relato. Na versão de demonstração, nenhum órgão público é de fato acionado.',
  },
  {
    id: 'in_progress',
    label: 'Em andamento',
    description: 'O registro indica que o problema está sendo tratado.',
  },
  {
    id: 'resolved',
    label: 'Resolvida',
    description: 'O registro indica que o problema foi resolvido.',
  },
]

/** Desfecho alternativo: encerra o ciclo sem passar pelas etapas seguintes. */
export const NOT_APPLICABLE_STATUS = {
  id: 'not_applicable',
  label: 'Não procedente',
  description:
    'A moderação concluiu que o relato não se aplica ou não pôde ser confirmado.',
}

const ALL = [...REPORT_STATUSES, NOT_APPLICABLE_STATUS]

export function getStatus(id) {
  const status = ALL.find((s) => s.id === id)
  if (!status) throw new Error(`Status de relato desconhecido: ${id}`)
  return status
}

/** Um relato resolvido ou não procedente não muda mais (o "tempo de espera" para). */
export function isClosedStatus(id) {
  return id === 'resolved' || id === 'not_applicable'
}

/** Posição da etapa no ciclo principal (0 = Recebida). -1 para "Não procedente". */
export function statusStep(id) {
  return REPORT_STATUSES.findIndex((s) => s.id === id)
}

/**
 * Para onde a administração pode levar um relato. Só se avança: etapas seguintes
 * do ciclo (inclusive pulando as do meio) ou "Não procedente". Relato encerrado
 * não volta a abrir.
 */
export function nextStatusOptions(currentId) {
  if (isClosedStatus(currentId)) return []
  const step = statusStep(currentId)
  return [...REPORT_STATUSES.filter((_, index) => index > step), NOT_APPLICABLE_STATUS]
}

/** Etapas em que a administração precisa justificar publicamente (a nota aparece para o morador). */
export const STATUSES_REQUIRING_NOTE = ['forwarded', 'not_applicable']

export const STATUS_NOTE_MAX = 280
export const STATUS_NOTE_MIN = 10
