/**
 * Descreve um elemento interativo em português, para o modo de toque duplo falar.
 * Usa só o DOM (nome acessível simplificado + papel), sem depender de React.
 */

const collapse = (text) => (text ?? '').replace(/\s+/g, ' ').trim()

/** Nome acessível, na ordem de prioridade que os leitores de tela usam (versão simplificada). */
export function accessibleName(el) {
  const labelledby = el.getAttribute('aria-labelledby')
  if (labelledby) {
    const text = labelledby
      .split(/\s+/)
      .map((id) => collapse(el.ownerDocument.getElementById(id)?.textContent))
      .filter(Boolean)
      .join(' ')
    if (text) return text
  }
  const label = collapse(el.getAttribute('aria-label'))
  if (label) return label
  if (el.labels?.length) {
    const text = collapse([...el.labels].map((l) => l.textContent).join(' '))
    if (text) return text
  }
  const text = collapse(el.textContent)
  if (text) return text
  const alt = collapse(el.querySelector?.('img[alt]')?.getAttribute('alt'))
  if (alt) return alt
  return collapse(el.getAttribute('title')) || collapse(el.getAttribute('placeholder'))
}

const FIELD_TYPES = new Set([
  'text',
  'search',
  'email',
  'tel',
  'url',
  'password',
  'number',
])

/**
 * Classifica o elemento: 'link', 'button', 'checkbox', 'radio', 'tab' ou 'field'
 * (campo de texto, área de texto, lista de escolha).
 */
export function elementKind(el) {
  const role = el.getAttribute('role')
  const tag = el.tagName.toLowerCase()
  if (role === 'tab') return 'tab'
  if (role === 'link' || (tag === 'a' && el.hasAttribute('href'))) return 'link'
  if (role === 'button' || tag === 'button' || tag === 'summary') return 'button'
  if (tag === 'input') {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase()
    if (type === 'checkbox') return 'checkbox'
    if (type === 'radio') return 'radio'
    if (type === 'submit' || type === 'button') return 'button'
    if (FIELD_TYPES.has(type)) return 'field'
    return null
  }
  if (tag === 'textarea' || tag === 'select') return 'field'
  return null
}

const KIND_LABEL = {
  link: 'link',
  button: 'botão',
  checkbox: 'caixa de seleção',
  radio: 'opção',
  tab: 'aba',
  field: 'campo',
}

/** Estado a falar junto com o nome ("selecionado", "marcada"...), ou texto vazio. */
function stateOf(el, kind) {
  if (kind === 'checkbox' || kind === 'radio')
    return el.checked ? 'marcada' : 'desmarcada'
  if (el.getAttribute('aria-pressed') === 'true') return 'selecionado'
  if (el.getAttribute('aria-pressed') === 'false') return 'não selecionado'
  if (el.getAttribute('aria-selected') === 'true') return 'selecionada'
  if (el.getAttribute('aria-current')) return 'atual'
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return 'indisponível'
  return ''
}

/**
 * Frase para narrar: "Estado, link, atual." Campos de texto só dizem o nome e o tipo.
 * Devolve `null` se o elemento não é algo que o modo guiado trate.
 */
export function describeElement(el) {
  const kind = elementKind(el)
  if (!kind) return null
  const name = accessibleName(el) || 'sem nome'
  const state = stateOf(el, kind)
  return {
    kind,
    text: [name, KIND_LABEL[kind], state].filter(Boolean).join(', '),
  }
}
