import { CategoryIllustration } from '../illustrations/Illustrations.jsx'
import { Skeleton } from '../ui/States.jsx'
import { getCategory } from '../../domain/reportCategories.js'
import { useImageUrl } from './useImageUrl.js'

/** Foto do relato (do IndexedDB). Se a foto sumiu, mostra a ilustração, dizendo que a foto não está disponível. */
export function PostImage({ post }) {
  const { url, loading, missing } = useImageUrl(post.imageId)
  if (loading) return <Skeleton className="h-full w-full rounded-none" />
  if (url) {
    return (
      <img
        src={url}
        alt={`Foto enviada pelo morador: ${post.title}`}
        className="h-full w-full object-cover"
      />
    )
  }
  return (
    <>
      <CategoryIllustration category={getCategory(post.category).illustration} />
      {missing && (
        <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-xs font-bold text-canvas">
          Foto indisponível
        </span>
      )}
    </>
  )
}
