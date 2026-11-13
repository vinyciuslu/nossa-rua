import { z } from 'zod'
import { getCategory, isKnownCategory } from './reportCategories.js'
import { getNeighborhood } from './places.js'

export const REPORT_TITLE_MAX = 80
export const REPORT_DESCRIPTION_MAX = 500

const neighborhoodId = z
  .string()
  .refine((id) => Boolean(getNeighborhood(id)), 'Escolha o bairro.')

const title = z
  .string()
  .trim()
  .min(5, 'Escreva um título com pelo menos 5 letras.')
  .max(REPORT_TITLE_MAX, `O título pode ter até ${REPORT_TITLE_MAX} caracteres.`)

const description = (min) =>
  z
    .string()
    .trim()
    .min(min, `Descreva com pelo menos ${min} caracteres.`)
    .max(
      REPORT_DESCRIPTION_MAX,
      `A descrição pode ter até ${REPORT_DESCRIPTION_MAX} caracteres.`,
    )

export const reportSchema = z
  .object({
    category: z.string().refine(isKnownCategory, 'Escolha a categoria.'),
    neighborhoodId,
    title,
    description: description(20),
    // O arquivo já vem tratado (Blob). A obrigatoriedade depende da categoria.
    photo: z.custom((v) => v == null || v instanceof Blob).nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      isKnownCategory(data.category) &&
      getCategory(data.category).photoRequired &&
      !data.photo
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['photo'],
        message:
          'Nesta categoria a foto é obrigatória: ela ajuda a comprovar o problema.',
      })
    }
  })

export const commercialSchema = z.object({
  neighborhoodId,
  title,
  description: description(20),
})
