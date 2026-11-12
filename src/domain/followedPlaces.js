import { getNeighborhood } from './places.js'

/**
 * Bairros acompanhados. Cada item tem um rótulo ("Casa", "Trabalho"...).
 *
 * As funções são puras: recebem a lista atual e devolvem `{ list }` com a nova
 * lista, ou `{ error }` com uma mensagem pronta para mostrar à pessoa.
 */

export const MAX_FOLLOWED_PLACES = 5

export const PLACE_LABELS = ['Casa', 'Trabalho', 'Faculdade', 'Outro']

/** Estes rótulos só podem aparecer uma vez; "Outro" pode repetir. */
const UNIQUE_LABELS = ['Casa', 'Trabalho', 'Faculdade']

function checkLabel(list, label, ignoreNeighborhoodId) {
  if (!PLACE_LABELS.includes(label)) return 'Escolha um rótulo da lista.'
  const taken = list.some(
    (item) =>
      item.label === label &&
      item.neighborhoodId !== ignoreNeighborhoodId &&
      UNIQUE_LABELS.includes(label),
  )
  return taken ? `Você já tem um bairro com o rótulo "${label}".` : null
}

export function addFollowedPlace(list, { neighborhoodId, label }) {
  if (!getNeighborhood(neighborhoodId)) return { error: 'Escolha um bairro da lista.' }
  if (list.some((item) => item.neighborhoodId === neighborhoodId)) {
    return { error: 'Você já acompanha esse bairro.' }
  }
  if (list.length >= MAX_FOLLOWED_PLACES) {
    return {
      error: `Você pode acompanhar até ${MAX_FOLLOWED_PLACES} bairros. Remova um para adicionar outro.`,
    }
  }
  const labelError = checkLabel(list, label)
  if (labelError) return { error: labelError }
  return { list: [...list, { neighborhoodId, label }] }
}

export function relabelFollowedPlace(list, neighborhoodId, label) {
  const labelError = checkLabel(list, label, neighborhoodId)
  if (labelError) return { error: labelError }
  return {
    list: list.map((item) =>
      item.neighborhoodId === neighborhoodId ? { ...item, label } : item,
    ),
  }
}

export function removeFollowedPlace(list, neighborhoodId) {
  return { list: list.filter((item) => item.neighborhoodId !== neighborhoodId) }
}
