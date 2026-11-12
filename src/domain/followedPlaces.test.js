import { describe, expect, it } from 'vitest'
import {
  MAX_FOLLOWED_PLACES,
  addFollowedPlace,
  relabelFollowedPlace,
  removeFollowedPlace,
} from './followedPlaces.js'

const casa = { neighborhoodId: 'sao-paulo/pinheiros', label: 'Casa' }

describe('bairros acompanhados', () => {
  it('adiciona um bairro com rótulo', () => {
    const { list } = addFollowedPlace([], casa)
    expect(list).toEqual([casa])
  })

  it('recusa bairro desconhecido, repetido e rótulo fora da lista', () => {
    expect(addFollowedPlace([], { neighborhoodId: 'x/y', label: 'Casa' }).error).toMatch(
      /bairro da lista/,
    )
    expect(addFollowedPlace([casa], { ...casa, label: 'Trabalho' }).error).toMatch(
      /já acompanha/,
    )
    expect(
      addFollowedPlace([], { neighborhoodId: 'santos/gonzaga', label: 'Escritório' })
        .error,
    ).toMatch(/rótulo/)
  })

  it('Casa, Trabalho e Faculdade só aparecem uma vez; Outro pode repetir', () => {
    const second = { neighborhoodId: 'santos/gonzaga', label: 'Casa' }
    expect(addFollowedPlace([casa], second).error).toMatch(/"Casa"/)
    const a = addFollowedPlace([casa], { ...second, label: 'Outro' }).list
    const b = addFollowedPlace(a, { neighborhoodId: 'campinas/cambui', label: 'Outro' })
    expect(b.list).toHaveLength(3)
  })

  it('respeita o limite máximo', () => {
    let list = []
    const ids = [
      'sao-paulo/mooca',
      'sao-paulo/lapa',
      'santos/gonzaga',
      'santos/embare',
      'campinas/cambui',
    ]
    for (const id of ids)
      list = addFollowedPlace(list, { neighborhoodId: id, label: 'Outro' }).list
    expect(list).toHaveLength(MAX_FOLLOWED_PLACES)
    expect(addFollowedPlace(list, casa).error).toMatch(/até 5/)
  })

  it('troca o rótulo sem conflitar consigo mesmo', () => {
    const list = [casa, { neighborhoodId: 'santos/gonzaga', label: 'Trabalho' }]
    expect(relabelFollowedPlace(list, casa.neighborhoodId, 'Casa').list).toEqual(list)
    expect(relabelFollowedPlace(list, casa.neighborhoodId, 'Trabalho').error).toMatch(
      /"Trabalho"/,
    )
    expect(
      relabelFollowedPlace(list, casa.neighborhoodId, 'Faculdade').list[0].label,
    ).toBe('Faculdade')
  })

  it('remove um bairro e não altera a lista original', () => {
    const list = [casa]
    expect(removeFollowedPlace(list, casa.neighborhoodId).list).toEqual([])
    expect(list).toHaveLength(1)
  })
})
