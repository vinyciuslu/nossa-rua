import { describe, expect, it } from 'vitest'
import { accessibleName, describeElement, elementKind } from './describeElement.js'

function html(markup) {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  return host
}

describe('accessibleName', () => {
  it('prefere aria-labelledby, depois aria-label, rótulo, texto e título', () => {
    const host = html(`
      <span id="t">Título externo</span>
      <button id="a" aria-labelledby="t" aria-label="outro">x</button>
      <button id="b" aria-label="Fechar aviso">x</button>
      <label for="c">E-mail</label><input id="c" type="email" />
      <button id="d">  Relatar   um
        problema </button>
      <button id="e" title="Só o título"><svg></svg></button>
    `)
    const get = (id) => host.querySelector(`#${id}`)
    expect(accessibleName(get('a'))).toBe('Título externo')
    expect(accessibleName(get('b'))).toBe('Fechar aviso')
    expect(accessibleName(get('c'))).toBe('E-mail')
    expect(accessibleName(get('d'))).toBe('Relatar um problema')
    expect(accessibleName(get('e'))).toBe('Só o título')
    host.remove()
  })

  it('usa o texto alternativo de uma imagem dentro do botão', () => {
    const host = html('<a href="/x"><img alt="Início" src="x.png" /></a>')
    expect(accessibleName(host.querySelector('a'))).toBe('Início')
    host.remove()
  })
})

describe('elementKind e describeElement', () => {
  it('classifica os elementos que o modo guiado trata', () => {
    const host = html(`
      <a id="l" href="/x">Ir</a><a id="n">sem href</a>
      <button id="b">ok</button>
      <input id="c" type="checkbox" /><input id="t" type="text" /><input id="h" type="hidden" />
      <div id="r" role="tab">aba</div><textarea id="a"></textarea>
    `)
    const kind = (id) => elementKind(host.querySelector(`#${id}`))
    expect(kind('l')).toBe('link')
    expect(kind('n')).toBeNull()
    expect(kind('b')).toBe('button')
    expect(kind('c')).toBe('checkbox')
    expect(kind('t')).toBe('field')
    expect(kind('h')).toBeNull()
    expect(kind('r')).toBe('tab')
    expect(kind('a')).toBe('field')
    host.remove()
  })

  it('monta a frase com nome, tipo e estado', () => {
    const host = html(`
      <a href="/estado" aria-current="page">Estado</a>
      <button aria-pressed="true">Grande</button>
      <button aria-pressed="false">Padrão</button>
      <label><input type="checkbox" checked /> Aceito os termos</label>
      <button disabled>Enviar</button>
    `)
    const [link, on, off] = host.querySelectorAll('a, button')
    expect(describeElement(link).text).toBe('Estado, link, atual')
    expect(describeElement(on).text).toBe('Grande, botão, selecionado')
    expect(describeElement(off).text).toBe('Padrão, botão, não selecionado')
    expect(describeElement(host.querySelector('input')).text).toContain(
      'caixa de seleção, marcada',
    )
    expect(describeElement(host.querySelector('[disabled]')).text).toBe(
      'Enviar, botão, indisponível',
    )
    host.remove()
  })
})
