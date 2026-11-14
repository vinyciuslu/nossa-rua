import { CategoryIllustration } from '../../components/illustrations/Illustrations.jsx'
import { PostImage } from '../../components/post/PostImage.jsx'
import { PostCard } from '../../components/ui/PostCard.jsx'
import { formatRelative } from '../../domain/relativeTime.js'
import { getCategory } from '../../domain/reportCategories.js'
import { formatPlace, getCity } from '../../domain/places.js'

/** Aviso para o município inteiro não tem bairro: mostra o município. */
function placeOf(post) {
  if (post.neighborhoodId) return formatPlace(post.neighborhoodId)
  const city = post.cityId ? getCity(post.cityId) : null
  return city ? `${city.name} · todo o município` : ''
}

/** Traduz uma publicação (dados do serviço) para o PostCard (apresentação). */
export function PostListItem({
  post,
  now,
  accountId,
  onOpen,
  onToggleSupport,
  supportPending,
  detail,
}) {
  const isReport = post.type === 'report'
  const hasPhoto = isReport && Boolean(post.imageId)
  return (
    <PostCard
      type={post.type}
      title={post.title}
      description={post.description}
      location={placeOf(post)}
      timeLabel={formatRelative(post.createdAt, now)}
      simulated={post.simulated}
      detail={detail}
      onOpen={onOpen}
      image={
        hasPhoto ? (
          <PostImage post={post} />
        ) : isReport ? (
          <CategoryIllustration category={getCategory(post.category).illustration} />
        ) : undefined
      }
      imageKind={hasPhoto ? 'photo' : 'illustration'}
      ownPost={Boolean(accountId) && post.authorId === accountId}
      status={post.status}
      supports={post.supports}
      supported={post.supported}
      supportPending={supportPending}
      onToggleSupport={onToggleSupport}
      level={post.level}
      source={post.source}
      businessName={post.businessName}
    />
  )
}
