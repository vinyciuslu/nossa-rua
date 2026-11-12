import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  // Cada teste começa com o aparelho "limpo": sem contas, sessão nem preferências.
  window.localStorage.clear()
  delete document.documentElement.dataset.colorMode
  delete document.documentElement.dataset.iconSize
})
