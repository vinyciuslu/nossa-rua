import { CategoryIllustration } from '../../components/illustrations/Illustrations.jsx'
import { PostCard } from '../../components/ui/PostCard.jsx'
import { formatRelative } from '../../domain/relativeTime.js'
import { getCategory } from '../../domain/reportCategories.js'
import { formatPlace } from '../../domain/places.js'

/** Traduz uma publicação (dados do serviço) para o PostCard (apresentação). */
export function PostListItem({
  post,
  now,
  onOpen,
  onToggleSupport,
  supportPending,
  detail,
}) {
  const isReport = post.type === 'report'
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
        isReport ? (
          <CategoryIllustration category={getCategory(post.category).illustration} />
        ) : undefined
      }
      imageKind="illustration"
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
