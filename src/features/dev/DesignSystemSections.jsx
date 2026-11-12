import { useEffect, useState } from 'react'
import { Bell, House, Landmark, Map, MapPin, Search, User } from 'lucide-react'
import {
  CategoryIllustration,
  EmptyIllustration,
} from '../../components/illustrations/Illustrations.jsx'
import { BottomSheet } from '../../components/ui/BottomSheet.jsx'
import { Button, IconButton } from '../../components/ui/Button.jsx'
import { Chip } from '../../components/ui/Chip.jsx'
import { SelectField, TextAreaField, TextField } from '../../components/ui/FormFields.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { PostCard } from '../../components/ui/PostCard.jsx'
import { SimulatedBadge } from '../../components/ui/SimulatedBadge.jsx'
import { SourceBadge } from '../../components/ui/SourceBadge.jsx'
import { StatusBadge } from '../../components/ui/StatusBadge.jsx'
import { StatusTimeline } from '../../components/ui/StatusTimeline.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { TrafficBadge } from '../../components/ui/TrafficBadge.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { REPORT_STATUSES, NOT_APPLICABLE_STATUS } from '../../domain/reportStatus.js'
import { useAccessibility } from '../../context/AccessibilityContext.jsx'
import { DemoScreen } from './DemoScreen.jsx'

export function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------- Cores
const TOKEN_GROUPS = [
  [
    'Superfícies e texto',
    ['canvas', 'surface', 'surface-warm', 'ink', 'ink-muted', 'line', 'line-strong'],
  ],
  ['Marca', ['primary', 'primary-soft', 'primary-ink', 'accent', 'focus']],
  ['Bom (livre, resolvida)', ['ok', 'ok-soft', 'ok-ink']],
  ['Atenção (moderado)', ['warn', 'warn-soft', 'warn-ink']],
  ['Crítico (intenso, urgente)', ['danger', 'danger-soft', 'danger-ink']],
]

export function ColorsSection() {
  const { colorMode } = useAccessibility()
  const [values, setValues] = useState({})

  useEffect(() => {
    // Espera o atributo data-color-mode ser aplicado no <html> antes de ler.
    const frame = requestAnimationFrame(() => {
      const style = getComputedStyle(document.documentElement)
      const next = {}
      for (const [, names] of TOKEN_GROUPS) {
        for (const name of names) next[name] = style.getPropertyValue(`--${name}`).trim()
      }
      setValues(next)
    })
    return () => cancelAnimationFrame(frame)
  }, [colorMode])

  return (
    <Section
      title="Cores"
      description="Tokens semânticos: os componentes usam estes nomes, nunca cores literais. Troque o modo de cor no topo e todos os valores mudam juntos."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {TOKEN_GROUPS.map(([group, names]) => (
          <div key={group}>
            <h3 className="mb-2 font-bold text-ink">{group}</h3>
            <ul className="flex flex-col gap-1.5">
              {names.map((name) => (
                <li key={name} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="hairline size-9 shrink-0 rounded-control border-line-strong"
                    style={{ background: `var(--${name})` }}
                  />
                  <span className="text-sm text-ink">
                    <code className="font-bold">{name}</code>
                    <span className="ml-2 text-ink-muted">{values[name]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Tipografia
export function TypographySection() {
  return (
    <Section
      title="Tipografia"
      description="Títulos em fonte com personalidade (escolha no topo: Sora ou Bricolage Grotesque). Texto corrido em Atkinson Hyperlegible, desenhada para legibilidade."
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="font-display text-4xl leading-tight font-bold text-ink">
          Um buraco na avenida, 24 vizinhos apoiando
        </p>
        <p className="font-display text-2xl font-bold text-ink">Seus bairros, hoje</p>
        <p className="font-display text-lg font-bold text-ink">
          Relato publicado há 2 horas
        </p>
        <p className="text-base text-ink">
          Texto corrido: a plataforma mostra de onde vem cada informação. Ação, coração,
          são paulino, atenção, 0123456789. O texto precisa ficar legível em telas
          pequenas, com bom contraste e espaçamento.
        </p>
        <p className="text-sm text-ink-muted">
          Texto secundário: datas, bairros e legendas. Nunca menor que 13 px.
        </p>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Ícones
export function IconsSection() {
  return (
    <Section
      title="Ícones e áreas de toque"
      description="Todos os ícones usam três tamanhos que o modo “Ícones grandes” (no topo) aumenta junto com as áreas de toque e o texto. Área de toque mínima: 44 px (56 px no modo grande)."
    >
      <div className="flex flex-wrap items-end gap-8">
        {['sm', 'md', 'lg'].map((size) => (
          <figure key={size} className="flex flex-col items-center gap-2">
            <div className="flex gap-3 text-ink">
              {[House, Landmark, Map, Bell, User].map((glyph, i) => (
                <Icon key={i} icon={glyph} size={size} />
              ))}
            </div>
            <figcaption className="text-sm text-ink-muted">
              <code>{size}</code>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <IconButton
          icon={Search}
          label="Buscar"
          className="hairline border-line-strong bg-surface"
        />
        <IconButton
          icon={Bell}
          label="Notificações"
          className="hairline border-line-strong bg-surface"
        />
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Botões e chips
export function ControlsSection() {
  const [filter, setFilter] = useState('all')
  const filters = [
    ['all', 'Tudo'],
    ['notices', 'Avisos'],
    ['reports', 'Relatos'],
    ['shops', 'Comércio'],
  ]
  return (
    <Section
      title="Botões e chips"
      description="Um botão de acento por tela, reservado à ação principal."
    >
      <div className="flex flex-wrap gap-3">
        <Button variant="accent" icon={MapPin}>
          Denunciar
        </Button>
        <Button>Salvar</Button>
        <Button variant="secondary">Cancelar</Button>
        <Button variant="ghost">Ver detalhes</Button>
        <Button disabled>Indisponível</Button>
      </div>
      <div role="group" aria-label="Filtro de exemplo" className="flex flex-wrap gap-2">
        {filters.map(([id, label]) => (
          <Chip key={id} selected={filter === id} onClick={() => setFilter(id)}>
            {label}
          </Chip>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Selos
export function BadgesSection() {
  return (
    <Section
      title="Selos de origem, simulação, status e trânsito"
      description="Significado sempre em ícone + texto. A cor só reforça."
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="mb-2 font-bold text-ink">Origem da informação</h3>
          <div className="flex flex-wrap gap-2">
            <SourceBadge kind="resident" />
            <SourceBadge kind="moderation" />
            <SourceBadge kind="official" />
          </div>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            “Fonte institucional verificada” só existe como variante: exige integração
            real, e nenhum dado desta versão a usa.
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-bold text-ink">Simulação</h3>
          <div className="flex flex-wrap gap-2">
            <SimulatedBadge />
            <SimulatedBadge>Dados simulados</SimulatedBadge>
            <SimulatedBadge>Previsão simulada</SimulatedBadge>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-bold text-ink">Status do relato</h3>
          <div className="flex flex-wrap gap-2">
            {[...REPORT_STATUSES, NOT_APPLICABLE_STATUS].map((s) => (
              <StatusBadge key={s.id} status={s.id} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-bold text-ink">Nível de trânsito</h3>
          <div className="flex flex-wrap gap-2">
            <TrafficBadge level="free" />
            <TrafficBadge level="moderate" />
            <TrafficBadge level="heavy" />
          </div>
          <figure className="mt-3 max-w-sm">
            <svg
              viewBox="0 0 320 60"
              role="img"
              aria-label="Exemplo de traços no mapa: livre contínuo, moderado tracejado, intenso pontilhado"
              className="w-full"
            >
              <path
                d="M10 12h300"
                className="stroke-ok"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M10 30h300"
                className="stroke-warn"
                strokeWidth="7"
                strokeDasharray="22 12"
                strokeLinecap="round"
              />
              <path
                d="M10 48h300"
                className="stroke-danger"
                strokeWidth="7"
                strokeDasharray="1 12"
                strokeLinecap="round"
              />
            </svg>
            <figcaption className="text-sm text-ink-muted">
              No mapa (Etapa 5), além de cor, o traço muda: contínuo, tracejado,
              pontilhado.
            </figcaption>
          </figure>
        </div>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Formulários
export function FormsSection() {
  return (
    <Section
      title="Campos de formulário"
      description="Rótulo sempre visível, dica e erro ligados ao campo, “obrigatório” escrito."
    >
      <form
        className="flex max-w-sm flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        <TextField
          label="Título do relato"
          hint="Resuma o problema em poucas palavras."
          required
          placeholder="Ex.: Poste apagado na esquina"
        />
        <TextAreaField
          label="Descrição"
          required
          error="Descreva o problema com pelo menos 20 caracteres."
          defaultValue="Poste."
          aria-invalid="true"
        />
        <SelectField label="Categoria" required defaultValue="">
          <option value="" disabled>
            Selecione
          </option>
          <option>Iluminação pública</option>
          <option>Infraestrutura</option>
          <option>Limpeza urbana</option>
        </SelectField>
      </form>
    </Section>
  )
}

// ---------------------------------------------------------------- Cartões
export function CardsSection() {
  const [supported, setSupported] = useState(false)
  return (
    <Section
      title="Cartões de publicação"
      description="Três tipos, distintos por forma: relato (liso, com apoio), aviso (faixa lateral e nível) e comercial (fundo quente, borda tracejada, “Publicidade”). Os textos abaixo são exemplos simulados."
    >
      <div className="flex max-w-[390px] flex-col gap-4">
        <PostCard
          type="report"
          title="Poste apagado na esquina da Rua Mourato Coelho"
          description="O poste em frente à padaria está sem luz há quatro dias. À noite o trecho fica muito escuro para quem volta a pé."
          location="Pinheiros · São Paulo"
          timeLabel="há 2 h"
          image={<CategoryIllustration category="lighting" />}
          imageKind="illustration"
          status="in_review"
          supports={supported ? 25 : 24}
          supported={supported}
          onToggleSupport={() => setSupported((v) => !v)}
          simulated
        />
        <PostCard
          type="notice"
          level="urgent"
          source="moderation"
          title="Alagamento na Marginal: evite o trecho"
          description="Exemplo de aviso urgente. Tem fundo de destaque e faixa lateral, sem tirar o aviso da organização do feed."
          location="Vila Leopoldina · São Paulo"
          timeLabel="há 20 min"
          simulated
        />
        <PostCard
          type="notice"
          level="attention"
          source="moderation"
          title="Obra interdita uma faixa até sexta"
          description="Exemplo de aviso com nível “Atenção”."
          location="Mooca · São Paulo"
          timeLabel="ontem"
          simulated
        />
        <PostCard
          type="commercial"
          title="Café da manhã em dobro às quartas"
          businessName="Padaria Exemplo"
          description="Exemplo de publicação comercial. Aparece com o selo “Publicidade” e nunca se confunde com um relato ou aviso."
          location="Vila Mariana · São Paulo"
          timeLabel="hoje"
          image={<CategoryIllustration category="generic" />}
          imageKind="illustration"
          simulated
        />
        <div
          aria-busy="true"
          className="hairline flex flex-col gap-3 rounded-card border-line bg-surface p-4"
        >
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Linha do tempo
const D = (day, hm) => `2026-11-${day}T${hm}:00-03:00`
const TIMELINES = {
  progress: {
    label: 'Em andamento',
    events: [
      { status: 'received', at: D('05', '14:10'), by: 'author' },
      { status: 'in_review', at: D('06', '09:30'), by: 'moderation', simulated: true },
      {
        status: 'forwarded',
        at: D('07', '16:45'),
        by: 'moderation',
        simulated: true,
        note: 'Encaminhamento registrado na plataforma, sem acionar nenhum órgão público (demonstração).',
      },
      { status: 'in_progress', at: D('09', '11:05'), by: 'moderation', simulated: true },
    ],
  },
  resolved: {
    label: 'Resolvida (com etapas puladas)',
    events: [
      { status: 'received', at: D('01', '08:20'), by: 'author' },
      {
        status: 'resolved',
        at: D('04', '17:00'),
        by: 'moderation',
        simulated: true,
        note: 'A moderação marcou o relato como resolvido (demonstração).',
      },
    ],
  },
  notApplicable: {
    label: 'Não procedente',
    events: [
      { status: 'received', at: D('08', '10:00'), by: 'author' },
      { status: 'in_review', at: D('09', '13:15'), by: 'moderation', simulated: true },
      {
        status: 'not_applicable',
        at: D('10', '09:00'),
        by: 'moderation',
        simulated: true,
        note: 'Não foi possível confirmar o problema com as informações enviadas.',
      },
    ],
  },
}

export function TimelineSection() {
  const [key, setKey] = useState('progress')
  return (
    <Section
      title="Acompanhamento do relato"
      description="O cidadão vê o ciclo inteiro: etapas feitas, etapa atual, etapas que ainda não aconteceram e etapas não registradas. Cada atualização simulada é marcada, e um aviso fixo lembra que nada aqui é ação oficial."
    >
      <div role="group" aria-label="Exemplo de ciclo" className="flex flex-wrap gap-2">
        {Object.entries(TIMELINES).map(([id, { label }]) => (
          <Chip key={id} selected={key === id} onClick={() => setKey(id)}>
            {label}
          </Chip>
        ))}
      </div>
      <div className="max-w-[390px]">
        <StatusTimeline events={TIMELINES[key].events} />
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Estados
export function StatesSection() {
  return (
    <Section title="Estados vazio, de erro e de carregamento">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="hairline rounded-card border-line bg-surface">
          <EmptyState
            illustration={<EmptyIllustration />}
            title="Nenhum relato por aqui"
            description="Ainda não há relatos nos bairros que você acompanha. Que tal acompanhar outro bairro?"
            action={<Button variant="secondary">Acompanhar bairro</Button>}
          />
        </div>
        <div className="hairline rounded-card border-line bg-surface">
          <ErrorState
            message="Não foi possível carregar os relatos agora. Seus dados continuam salvos."
            onRetry={() => {}}
          />
        </div>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------- Sobreposições
function OverlayDemo() {
  const [open, setOpen] = useState(false)
  const { show } = useToast()
  return (
    <div className="flex h-full flex-col items-start gap-3 p-4">
      <p className="text-sm text-ink-muted">
        A mini tela abaixo simula o celular: o painel e o aviso ficam presos nela.
      </p>
      <Button onClick={() => setOpen(true)}>Abrir painel</Button>
      <Button
        variant="secondary"
        onClick={() =>
          show('Apoio registrado. Obrigado por participar!', { tone: 'success' })
        }
      >
        Mostrar aviso de sucesso
      </Button>
      <Button
        variant="secondary"
        onClick={() => show('Não foi possível enviar. Tente de novo.', { tone: 'error' })}
      >
        Mostrar aviso de erro
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Av. Paulista (trecho)"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <TrafficBadge level="moderate" />
            <SimulatedBadge>Dados simulados</SimulatedBadge>
          </div>
          <p className="text-ink">
            Velocidade média 28 km/h de um limite de 50 km/h (56%).
          </p>
          <p className="text-sm text-ink-muted">
            Estimativa demonstrativa: semáforos e horário também influenciam a velocidade.
          </p>
          <Button onClick={() => setOpen(false)}>Entendi</Button>
        </div>
      </BottomSheet>
    </div>
  )
}

export function OverlaysSection() {
  return (
    <Section
      title="Painéis e avisos"
      description="BottomSheet (foco preso, Esc fecha, foco volta ao botão de origem) e Toast (anunciado por leitores de tela, some em 6 s)."
    >
      <DemoScreen>
        <OverlayDemo />
      </DemoScreen>
    </Section>
  )
}
