import { createId } from '../utils/id.js'
import { ServiceError } from './ServiceError.js'

/**
 * Fotos dos relatos, no IndexedDB do navegador.
 *
 * Por que não localStorage? Ele só guarda texto e tem cerca de 5 MB no total;
 * uma foto estoura isso. O IndexedDB guarda arquivos (Blob) direto e comporta
 * muito mais. Em um backend real, isto vira um envio para armazenamento de
 * arquivos e o relato guarda só o endereço.
 *
 * Abre o banco a cada operação: é simples e suficiente para o protótipo.
 */
const DB_NAME = 'nossa-rua-images'
const STORE = 'images'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(
        new ServiceError(
          'storage_unavailable',
          'Este navegador não permite guardar fotos.',
        ),
      )
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(
        new ServiceError(
          'storage_unavailable',
          'Não foi possível abrir o armazenamento de fotos.',
        ),
      )
  })
}

async function run(mode, action) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = action(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request?.result)
      tx.onerror = () =>
        reject(
          new ServiceError(
            'storage_unavailable',
            'Não foi possível salvar a foto neste aparelho.',
          ),
        )
      tx.onabort = tx.onerror
    })
  } finally {
    db.close()
  }
}

/** Guarda a foto e devolve o id interno dela. */
export async function saveImage(blob) {
  const id = createId('img')
  await run('readwrite', (store) => store.put(blob, id))
  return id
}

/** Devolve o Blob, ou null se a foto não existe mais. */
export async function getImage(id) {
  const blob = await run('readonly', (store) => store.get(id))
  return blob ?? null
}

export async function deleteImages(ids) {
  if (ids.length === 0) return
  await run('readwrite', (store) => {
    ids.forEach((id) => store.delete(id))
  })
}
