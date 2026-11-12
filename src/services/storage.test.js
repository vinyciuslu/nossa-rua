import { describe, expect, it } from 'vitest'
import { storage } from './storage.js'

describe('storage', () => {
  it('grava e lê valores JSON com o prefixo do app', () => {
    expect(storage.write('k', { a: 1 })).toBe(true)
    expect(storage.read('k')).toEqual({ a: 1 })
    expect(window.localStorage.getItem('nossa-rua:v1:k')).toBe('{"a":1}')
  })

  it('devolve o valor padrão para chave ausente ou conteúdo corrompido', () => {
    expect(storage.read('nada', 'padrao')).toBe('padrao')
    window.localStorage.setItem('nossa-rua:v1:ruim', '{quebrado')
    expect(storage.read('ruim', [])).toEqual([])
  })

  it('clearAll apaga só as chaves do app', () => {
    storage.write('a', 1)
    window.localStorage.setItem('de-outro-app', 'x')
    storage.clearAll()
    expect(storage.read('a')).toBeNull()
    expect(window.localStorage.getItem('de-outro-app')).toBe('x')
  })
})
