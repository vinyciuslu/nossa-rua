import { BadgeCheck, Building2, ShieldCheck, Users } from 'lucide-react'
import { Badge } from './Badge.jsx'

/**
 * Origem de uma informação. É o componente central da regra de confiança do app:
 * um relato de morador nunca pode ser confundido com aviso da moderação ou com
 * informação institucional.
 *
 *  - resident:   relato publicado por morador (não confirmado)
 *  - moderation: aviso publicado pela moderação da plataforma
 *  - official:   fonte institucional verificada (exige integração real)
 *  - demo_institution: instituição INVENTADA, usada no conteúdo estadual de demonstração
 *
 * Nesta versão nenhum conteúdo usa "official" como se fosse real: o feed estadual
 * usa "demo_institution", que diz com todas as letras que a fonte é fictícia.
 */
const SOURCES = {
  resident: { label: 'Relato de morador', icon: Users, tone: 'neutral' },
  moderation: { label: 'Aviso da moderação', icon: ShieldCheck, tone: 'info' },
  official: { label: 'Fonte institucional verificada', icon: BadgeCheck, tone: 'solid' },
  demo_institution: { label: 'Instituição fictícia', icon: Building2, tone: 'neutral' },
}

export function SourceBadge({ kind, className = '' }) {
  const source = SOURCES[kind]
  if (!source) throw new Error(`Origem desconhecida: ${kind}`)
  return (
    <Badge tone={source.tone} icon={source.icon} className={className}>
      {source.label}
    </Badge>
  )
}
