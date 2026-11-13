import '@testing-library/jest-dom/vitest'
import { IDBFactory } from 'fake-indexeddb'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// IndexedDB de mentira: o jsdom não traz um.
globalThis.indexedDB = new IDBFactory()

afterEach(() => {
  cleanup()
  // Cada teste começa com o aparelho "limpo": sem contas, sessão nem preferências.
  window.localStorage.clear()
  globalThis.indexedDB = new IDBFactory() // IndexedDB limpo a cada teste
  delete document.documentElement.dataset.colorMode
  delete document.documentElement.dataset.iconSize
})
