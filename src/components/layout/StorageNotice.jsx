import { useState } from 'react'
import { Notice } from '../ui/Notice.jsx'
import { storage } from '../../services/storage.js'

/**
 * Se o navegador não deixa gravar dados, o app funciona, mas não lembra de nada ao
 * recarregar (login, preferências, publicações). Melhor dizer isso logo do que a
 * pessoa descobrir ao perder um relato escrito.
 */
export function StorageNotice() {
  const [available] = useState(() => storage.isAvailable())
  if (available) return null
  return (
    <div className="px-4 pt-3">
      <Notice tone="warn" title="Este navegador não permite salvar dados">
        <p>
          Você pode usar o app, mas login, preferências e publicações não serão lembrados
          depois de fechar ou recarregar a página. Desative a navegação privativa ou
          libere o armazenamento do site para guardar seus dados.
        </p>
      </Notice>
    </div>
  )
}
