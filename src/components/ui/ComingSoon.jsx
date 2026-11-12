import { Hammer } from 'lucide-react'
import { EmptyIllustration } from '../illustrations/Illustrations.jsx'
import { Badge } from './Badge.jsx'
import { EmptyState } from './States.jsx'

/** Tela provisória, honesta: diz que a funcionalidade ainda não existe e quando chega. */
export function ComingSoon({ title, description, stage }) {
  return (
    <EmptyState
      illustration={<EmptyIllustration />}
      title={title}
      description={description}
      action={
        <Badge tone="neutral" icon={Hammer}>
          Em construção · chega na Etapa {stage}
        </Badge>
      }
    />
  )
}
