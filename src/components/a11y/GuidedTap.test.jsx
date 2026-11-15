import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccessibilityProvider } from '../../context/AccessibilityContext.jsx'
import { useAccessibility } from '../../context/AccessibilityContext.jsx'
import { DOUBLE_TAP_WINDOW_MS, GuidedTap } from './GuidedTap.jsx'

let spoken
beforeEach(() => {
  spoken = []
  window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text
    }
  }
  window.speechSynthesis = {
    speak: vi.fn((u) => spoken.push(u.text)),
    cancel: vi.fn(),
  }
})
afterEach(() => {
  vi.useRealTimers()
  delete window.speechSynthesis
  delete window.SpeechSynthesisUtterance
})

/** Liga o modo e devolve o contador de ativações do botão de teste. */
function setup({ enabled = true } = {}) {
  const onActivate = vi.fn()
  function Enable() {
    const { setGuidedTap } = useAccessibility()
    return (
      <button type="button" data-testid="enable" onClick={() => setGuidedTap(true)}>
        liga
      </button>
    )
  }
  render(
    <AccessibilityProvider>
      <GuidedTap />
      <Enable />
      <button type="button" onClick={onActivate}>
        Relatar
      </button>
      <button type="button" onClick={onActivate}>
        Outro
      </button>
      <label>
        Nome <input type="text" />
      </label>
      <a href="#destino">Ir ao destino</a>
    </AccessibilityProvider>,
  )
  if (enabled) {
    fireEvent.click(screen.getByTestId('enable'), { detail: 1 })
  }
  return { onActivate }
}

/** Um toque de verdade tem `detail` 1; o teclado, 0. */
const tap = (el) => fireEvent.click(el, { detail: 1 })

describe('GuidedTap', () => {
  it('desligado, o clique passa direto e nada é falado', () => {
    const { onActivate } = setup({ enabled: false })
    tap(screen.getByRole('button', { name: 'Relatar' }))
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(spoken).toEqual([])
  })

  it('primeiro toque só descreve e destaca; o segundo ativa', () => {
    const { onActivate } = setup()
    const button = screen.getByRole('button', { name: 'Relatar' })

    tap(button)
    expect(onActivate).not.toHaveBeenCalled()
    expect(spoken).toEqual(['Relatar, botão. Toque de novo para ativar.'])
    expect(button).toHaveAttribute('data-guided-pending', 'true')

    tap(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(button).not.toHaveAttribute('data-guided-pending')
  })

  it('links dizem "abrir"', () => {
    setup()
    tap(screen.getByRole('link', { name: 'Ir ao destino' }))
    expect(spoken.at(-1)).toBe('Ir ao destino, link. Toque de novo para abrir.')
  })

  it('tocar em outro botão troca o item em espera', () => {
    const { onActivate } = setup()
    const a = screen.getByRole('button', { name: 'Relatar' })
    const b = screen.getByRole('button', { name: 'Outro' })
    tap(a)
    tap(b)
    expect(onActivate).not.toHaveBeenCalled()
    expect(a).not.toHaveAttribute('data-guided-pending')
    expect(b).toHaveAttribute('data-guided-pending', 'true')
  })

  it('passado o prazo, o segundo toque volta a ser o primeiro', () => {
    vi.useFakeTimers()
    const { onActivate } = setup()
    const button = screen.getByRole('button', { name: 'Relatar' })
    tap(button)
    act(() => vi.advanceTimersByTime(DOUBLE_TAP_WINDOW_MS + 100))
    expect(button).not.toHaveAttribute('data-guided-pending')
    tap(button)
    expect(onActivate).not.toHaveBeenCalled()
    expect(spoken).toHaveLength(2)
  })

  it('teclado e leitor de tela (clique sem detalhe) ativam direto', () => {
    const { onActivate } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Relatar' }), { detail: 0 })
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(spoken).toEqual([])
  })

  it('campo de texto fala o nome mas não é bloqueado', () => {
    setup()
    const field = screen.getByRole('textbox')
    const notPrevented = fireEvent.click(field, { detail: 1 })
    expect(notPrevented).toBe(true) // preventDefault não foi chamado
    expect(spoken.at(-1)).toBe('Nome, campo')
  })

  it('funciona sem narração: ainda exige dois toques', () => {
    delete window.speechSynthesis
    const { onActivate } = setup()
    const button = screen.getByRole('button', { name: 'Relatar' })
    tap(button)
    expect(onActivate).not.toHaveBeenCalled()
    expect(button).toHaveAttribute('data-guided-pending', 'true')
    tap(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})
