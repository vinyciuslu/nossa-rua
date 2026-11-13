import { CategoryIllustration } from '../../components/illustrations/Illustrations.jsx'
import { PostImage } from './PostImage.jsx'
import { PostCard } from '../../components/ui/PostCard.jsx'
import { formatRelative } from '../../domain/relativeTime.js'
import { getCategory } from '../../domain/reportCategories.js'
import { formatPlace } from '../../domain/places.js'

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
      location={formatPlace(post.neighborhoodId)}
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
