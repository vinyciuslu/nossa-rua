import { z } from 'zod'
import { getCity, getNeighborhood } from './places.js'
import {
  nextStatusOptions,
  STATUS_NOTE_MAX,
  STATUS_NOTE_MIN,
  STATUSES_REQUIRING_NOTE,
} from './reportStatus.js'

/**
 * Validação dos formulários da administração. Ficam no domínio como as regras de
 * conta e de publicação: o serviço valida de novo, como faria um backend.
 */

/**
 * Atualização de status. Depende do status ATUAL do relato (quais destinos valem),
 * por isso é uma função que devolve o schema.
 */
export function makeStatusUpdateSchema(currentStatus) {
  const allowed = nextStatusOptions(currentStatus).map((s) => s.id)
  return z
    .object({
      status: z.string().refine((id) => allowed.includes(id), 'Escolha a nova etapa.'),
      note: z
        .string()
        .trim()
        .max(STATUS_NOTE_MAX, `A nota pode ter até ${STATUS_NOTE_MAX} caracteres.`),
    })
    .superRefine((data, ctx) => {
      if (
        STATUSES_REQUIRING_NOTE.includes(data.status) &&
        data.note.length < STATUS_NOTE_MIN
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['note'],
          message: `Explique em pelo menos ${STATUS_NOTE_MIN} letras: o morador verá este texto.`,
        })
      }
    })
}

export const NOTICE_LEVELS = [
  { id: 'info', label: 'Informativo' },
  { id: 'attention', label: 'Atenção' },
  { id: 'urgent', label: 'Urgente' },
]

export const NOTICE_TITLE_MAX = 80
export const NOTICE_DESCRIPTION_MAX = 500

export const noticeSchema = z
  .object({
    level: z.enum(['info', 'attention', 'urgent'], 'Escolha o nível do aviso.'),
    title: z
      .string()
      .trim()
      .min(5, 'Escreva um título com pelo menos 5 letras.')
      .max(NOTICE_TITLE_MAX, `O título pode ter até ${NOTICE_TITLE_MAX} caracteres.`),
    description: z
      .string()
      .trim()
      .min(20, 'Descreva com pelo menos 20 caracteres.')
      .max(
        NOTICE_DESCRIPTION_MAX,
        `A descrição pode ter até ${NOTICE_DESCRIPTION_MAX} caracteres.`,
      ),
    scope: z.enum(['neighborhood', 'city']),
    cityId: z.string(),
    neighborhoodId: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'city' && !getCity(data.cityId)) {
      ctx.addIssue({ code: 'custom', path: ['cityId'], message: 'Escolha o município.' })
    }
    if (data.scope === 'neighborhood' && !getNeighborhood(data.neighborhoodId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['neighborhoodId'],
        message: 'Escolha o município e o bairro.',
      })
    }
  })
