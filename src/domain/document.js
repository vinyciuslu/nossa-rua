/**
 * CPF e CNPJ no protótipo.
 *
 * Regra de privacidade do projeto: o número informado é só VALIDADO (dígitos
 * verificadores) e descartado. Nada aqui é gravado, nem o número, nem hash.
 * O app guarda apenas o TIPO da conta e um identificador interno.
 *
 * Para os testes e para a demonstração, há geradores de números com dígitos
 * verificadores válidos. Um número "válido" pode, por acaso, pertencer a uma
 * pessoa real: por isso a interface orienta a usar só números gerados ao acaso.
 */

export const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '')

function checkDigit(digits, weights) {
  const sum = weights.reduce((total, weight, i) => total + Number(digits[i]) * weight, 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

const CPF_WEIGHTS_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2]
const CPF_WEIGHTS_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

const allSameDigit = (digits) => /^(\d)\1+$/.test(digits)

export function isValidCpf(value) {
  const digits = onlyDigits(value)
  if (digits.length !== 11 || allSameDigit(digits)) return false
  const d1 = checkDigit(digits, CPF_WEIGHTS_1)
  const d2 = checkDigit(digits, CPF_WEIGHTS_2)
  return d1 === Number(digits[9]) && d2 === Number(digits[10])
}

export function isValidCnpj(value) {
  const digits = onlyDigits(value)
  if (digits.length !== 14 || allSameDigit(digits)) return false
  const d1 = checkDigit(digits, CNPJ_WEIGHTS_1)
  const d2 = checkDigit(digits, CNPJ_WEIGHTS_2)
  return d1 === Number(digits[12]) && d2 === Number(digits[13])
}

export function formatCpf(value) {
  const d = onlyDigits(value).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function formatCnpj(value) {
  const d = onlyDigits(value).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function randomDigits(count, rng) {
  return Array.from({ length: count }, () => Math.floor(rng() * 10)).join('')
}

/** CPF com dígitos verificadores válidos, gerado ao acaso (ou com semente). */
export function generateCpf(rng = Math.random) {
  let base
  do {
    base = randomDigits(9, rng)
  } while (allSameDigit(base))
  const d1 = checkDigit(base, CPF_WEIGHTS_1)
  const d2 = checkDigit(base + d1, CPF_WEIGHTS_2)
  return formatCpf(base + d1 + d2)
}

/** CNPJ com dígitos verificadores válidos; filial "0001" fixa. */
export function generateCnpj(rng = Math.random) {
  let root
  do {
    root = randomDigits(8, rng)
  } while (allSameDigit(root))
  const base = root + '0001'
  const d1 = checkDigit(base, CNPJ_WEIGHTS_1)
  const d2 = checkDigit(base + d1, CNPJ_WEIGHTS_2)
  return formatCnpj(base + d1 + d2)
}
