import { describe, expect, it } from 'vitest'
import {
  formatCnpj,
  formatCpf,
  generateCnpj,
  generateCpf,
  isValidCnpj,
  isValidCpf,
  onlyDigits,
} from './document.js'
import { createRng } from './random.js'

describe('validação de CPF', () => {
  it('aceita números com dígitos verificadores corretos, com ou sem máscara', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
  })

  it('recusa dígito verificador errado, tamanho errado e sequências repetidas', () => {
    expect(isValidCpf('529.982.247-26')).toBe(false)
    expect(isValidCpf('529.982.247')).toBe(false)
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('')).toBe(false)
    expect(isValidCpf(undefined)).toBe(false)
  })
})

describe('validação de CNPJ', () => {
  it('aceita números com dígitos verificadores corretos', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11222333000181')).toBe(true)
  })

  it('recusa dígito verificador errado, tamanho errado e sequências repetidas', () => {
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false)
    expect(isValidCnpj('11.222.333/0001')).toBe(false)
    expect(isValidCnpj('00.000.000/0000-00')).toBe(false)
  })
})

describe('máscaras', () => {
  it('formatam enquanto a pessoa digita', () => {
    expect(formatCpf('5299')).toBe('529.9')
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
    expect(formatCpf('529982247259999')).toBe('529.982.247-25')
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatCnpj('112')).toBe('11.2')
  })

  it('onlyDigits ignora tudo que não é número', () => {
    expect(onlyDigits('12.3-4/5')).toBe('12345')
    expect(onlyDigits(null)).toBe('')
  })
})

describe('geradores de números fictícios', () => {
  it('geram CPF e CNPJ sempre válidos', () => {
    const rng = createRng('teste')
    for (let i = 0; i < 200; i++) {
      expect(isValidCpf(generateCpf(rng))).toBe(true)
      expect(isValidCnpj(generateCnpj(rng))).toBe(true)
    }
  })

  it('com a mesma semente, geram o mesmo número', () => {
    expect(generateCpf(createRng(7))).toBe(generateCpf(createRng(7)))
    expect(generateCpf(createRng(7))).not.toBe(generateCpf(createRng(8)))
  })
})
