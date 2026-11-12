import { act, render, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AccessibilityProvider, useAccessibility } from './AccessibilityContext.jsx'

describe('AccessibilityContext', () => {
  it('aplica modo de cor e tamanho de ícones como atributos no <html>', () => {
    const { result } = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    })
    const root = document.documentElement
    expect(root.dataset.colorMode).toBe('default')
    expect(root.dataset.iconSize).toBe('normal')

    act(() => result.current.setColorMode('high-contrast'))
    act(() => result.current.setLargeIcons(true))
    expect(root.dataset.colorMode).toBe('high-contrast')
    expect(root.dataset.iconSize).toBe('large')
  })

  it('falha com mensagem clara fora do provedor', () => {
    const Broken = () => {
      useAccessibility()
      return null
    }
    expect(() => render(<Broken />)).toThrow(/AccessibilityProvider/)
  })
})
