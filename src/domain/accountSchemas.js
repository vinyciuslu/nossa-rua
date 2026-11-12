import { z } from 'zod'
import { isValidCnpj, isValidCpf } from './document.js'
import { getNeighborhood } from './places.js'

/**
 * Regras de validação dos formulários de conta (Zod).
 * Ficam no domínio porque são regras do produto, não da tela, e o futuro
 * backend pode repetir as mesmas.
 */

const email = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .pipe(z.email('Informe um e-mail válido, como nome@exemplo.com.'))

const name = z
  .string()
  .trim()
  .min(2, 'Informe seu nome (pelo menos 2 letras).')
  .max(80, 'O nome pode ter até 80 caracteres.')

const neighborhoodId = z
  .string()
  .refine((id) => Boolean(getNeighborhood(id)), 'Escolha o município e o bairro.')

export const loginSchema = z.object({ email })

export const adminLoginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.'),
})

export const signupSchema = z
  .object({
    type: z.enum(['cpf', 'cnpj']),
    name,
    businessName: z.string().trim().max(80, 'O nome pode ter até 80 caracteres.'),
    email,
    document: z.string(),
    neighborhoodId,
    acceptedTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const isCompany = data.type === 'cnpj'
    const valid = isCompany ? isValidCnpj(data.document) : isValidCpf(data.document)
    if (!valid) {
      ctx.addIssue({
        code: 'custom',
        path: ['document'],
        message: isCompany
          ? 'CNPJ inválido. Use o botão para gerar um número fictício.'
          : 'CPF inválido. Use o botão para gerar um número fictício.',
      })
    }
    if (isCompany && data.businessName.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['businessName'],
        message: 'Informe o nome do comércio.',
      })
    }
    if (!data.acceptedTerms) {
      ctx.addIssue({
        code: 'custom',
        path: ['acceptedTerms'],
        message: 'É preciso concordar para criar a conta de demonstração.',
      })
    }
  })

export const profileSchema = z.object({
  name,
  businessName: z.string().trim().max(80, 'O nome pode ter até 80 caracteres.'),
})
