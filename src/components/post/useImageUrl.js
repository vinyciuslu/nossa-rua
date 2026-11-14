import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getImage } from '../../services/imageStore.js'

/** Carrega a foto do IndexedDB e a expõe como URL temporária (liberada ao sair da tela). */
export function useImageUrl(imageId) {
  const query = useQuery({
    queryKey: ['image', imageId],
    queryFn: () => getImage(imageId),
    enabled: Boolean(imageId),
    staleTime: Infinity,
    retry: false,
  })
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!query.data) {
      // Sincroniza com um recurso externo (URL de objeto do navegador): setState no efeito é intencional.
      // oxlint-disable-next-line react/set-state-in-effect
      setUrl(null)
      return undefined
    }
    const objectUrl = URL.createObjectURL(query.data)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [query.data])

  return {
    url,
    loading: Boolean(imageId) && query.isPending,
    missing: Boolean(imageId) && (query.isError || (query.isSuccess && !query.data)),
  }
}
