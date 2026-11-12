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

  it('lembra as escolhas neste aparelho e ignora valores desconhecidos', () => {
    const first = renderHook(() => useAccessibility(), { wrapper: AccessibilityProvider })
    act(() => first.result.current.setColorMode('red-green'))
    act(() => first.result.current.setLargeIcons(true))
    first.unmount()

    const second = renderHook(() => useAccessibility(), {
      wrapper: AccessibilityProvider,
    })
    expect(second.result.current.colorMode).toBe('red-green')
    expect(second.result.current.largeIcons).toBe(true)
    second.unmount()

    window.localStorage.setItem(
      'nossa-rua:v1:accessibility',
      JSON.stringify({ colorMode: 'neon', largeIcons: 'sim' }),
    )
    const third = renderHook(() => useAccessibility(), { wrapper: AccessibilityProvider })
    expect(third.result.current.colorMode).toBe('default')
    expect(third.result.current.largeIcons).toBe(false)
  })

  it('falha com mensagem clara fora do provedor', () => {
    const Broken = () => {
      useAccessibility()
      return null
    }
    expect(() => render(<Broken />)).toThrow(/AccessibilityProvider/)
  })
})
