import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BottomSheet } from './BottomSheet.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { PostCard } from './PostCard.jsx'
import { SourceBadge } from './SourceBadge.jsx'
import { StatusTimeline } from './StatusTimeline.jsx'
import { ToastProvider, useToast } from './Toast.jsx'
import { TrafficBadge } from './TrafficBadge.jsx'

describe('selos: significado em texto, não só em cor', () => {
  it('SourceBadge distingue relato de morador, aviso da moderação e fonte institucional', () => {
    render(
      <>
        <SourceBadge kind="resident" />
        <SourceBadge kind="moderation" />
        <SourceBadge kind="official" />
      </>,
    )
    expect(screen.getByText('Relato de morador')).toBeInTheDocument()
    expect(screen.getByText('Aviso da moderação')).toBeInTheDocument()
    expect(screen.getByText('Fonte institucional verificada')).toBeInTheDocument()
  })

  it('TrafficBadge mostra rótulo textual para cada nível', () => {
    render(
      <>
        <TrafficBadge level="free" />
        <TrafficBadge level="moderate" />
        <TrafficBadge level="heavy" />
      </>,
    )
    expect(screen.getByText('Trânsito livre')).toBeInTheDocument()
    expect(screen.getByText('Trânsito moderado')).toBeInTheDocument()
    expect(screen.getByText('Congestionamento intenso')).toBeInTheDocument()
  })
})

describe('PostCard', () => {
  it('relato: mostra a origem "Relato de morador", o status e alterna o apoio', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [supported, setSupported] = useState(false)
      return (
        <PostCard
          type="report"
          title="Poste apagado"
          description="Sem luz há quatro dias."
          location="Pinheiros · São Paulo"
          timeLabel="há 2 h"
          status="in_review"
          supports={24}
          supported={supported}
          onToggleSupport={() => setSupported((v) => !v)}
        />
      )
    }
    render(<Harness />)
    expect(screen.getByText('Relato de morador')).toBeInTheDocument()
    expect(screen.getByText('Em análise')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /Apoiar · 24/ })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(button)
    expect(screen.getByRole('button', { name: /Apoiado · 24/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('comercial: sempre identificado como "Publicidade", nunca como relato', () => {
    render(
      <PostCard
        type="commercial"
        title="Promoção"
        description="Café em dobro."
        location="Vila Mariana"
        timeLabel="hoje"
        businessName="Padaria Exemplo"
      />,
    )
    expect(screen.getByText('Publicidade')).toBeInTheDocument()
    expect(screen.queryByText('Relato de morador')).not.toBeInTheDocument()
  })

  it('marca conteúdo simulado e ilustrações', () => {
    render(
      <PostCard
        type="notice"
        level="urgent"
        title="Alagamento"
        description="Evite o trecho."
        location="Marginal"
        timeLabel="agora"
        image={<svg />}
        imageKind="illustration"
        simulated
      />,
    )
    expect(screen.getByText('Simulado')).toBeInTheDocument()
    expect(screen.getByText('Ilustração')).toBeInTheDocument()
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })
})

describe('StatusTimeline: transparência do ciclo do relato', () => {
  const events = [
    { status: 'received', at: '2026-11-05T14:10:00-03:00', by: 'author' },
    {
      status: 'in_review',
      at: '2026-11-06T09:30:00-03:00',
      by: 'moderation',
      simulated: true,
    },
  ]

  it('mostra o ciclo inteiro, a etapa atual e o que ainda não aconteceu', () => {
    render(<StatusTimeline events={events} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(within(items[1]).getByText(/etapa atual/)).toBeInTheDocument()
    expect(within(items[2]).getByText('Ainda não aconteceu.')).toBeInTheDocument()
    expect(within(items[4]).getByText('Resolvida')).toBeInTheDocument()
  })

  it('marca atualizações simuladas e mantém o aviso de que não é ação oficial', () => {
    render(<StatusTimeline events={events} />)
    expect(screen.getAllByText('Atualização simulada')).toHaveLength(1)
    expect(
      screen.getByText(/não indicam ação de nenhum órgão público/),
    ).toBeInTheDocument()
  })

  it('etapas puladas aparecem como "não registrada"', () => {
    render(
      <StatusTimeline
        events={[
          { status: 'received', at: '2026-11-01T08:20:00-03:00', by: 'author' },
          {
            status: 'resolved',
            at: '2026-11-04T17:00:00-03:00',
            by: 'moderation',
            simulated: true,
          },
        ]}
      />,
    )
    expect(screen.getAllByText('Etapa não registrada neste relato.')).toHaveLength(3)
  })

  it('"Não procedente" encerra o ciclo e não mostra etapas futuras', () => {
    render(
      <StatusTimeline
        events={[
          { status: 'received', at: '2026-11-08T10:00:00-03:00', by: 'author' },
          {
            status: 'not_applicable',
            at: '2026-11-10T09:00:00-03:00',
            by: 'moderation',
            simulated: true,
          },
        ]}
      />,
    )
    expect(screen.getByText('Não procedente')).toBeInTheDocument()
    expect(screen.queryByText('Ainda não aconteceu.')).not.toBeInTheDocument()
    expect(screen.queryByText('Resolvida')).not.toBeInTheDocument()
  })
})

describe('BottomSheet', () => {
  function Harness({ onClose = () => {} }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>Abrir</button>
        <BottomSheet
          open={open}
          onClose={() => {
            onClose()
            setOpen(false)
          }}
          title="Detalhes"
        >
          <button>Primeiro</button>
          <button>Último</button>
        </BottomSheet>
      </>
    )
  }

  it('abre como diálogo nomeado e leva o foco para dentro', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialog = screen.getByRole('dialog', { name: 'Detalhes' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toContainElement(document.activeElement)
  })

  it('Esc fecha e devolve o foco ao botão de origem', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Abrir' })
    await user.click(opener)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('Tab fica preso dentro do painel', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 6; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement)
    }
  })
})

describe('Toast', () => {
  it('anuncia a mensagem em uma região role="status"', async () => {
    const user = userEvent.setup()
    function Trigger() {
      const { show } = useToast()
      return (
        <button onClick={() => show('Apoio registrado', { tone: 'success' })}>
          Mostrar
        </button>
      )
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Apoio registrado')
  })
})

describe('ErrorBoundary', () => {
  function Broken() {
    throw new Error('quebrou')
  }

  it('mostra uma mensagem em vez de tela em branco quando uma tela quebra', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível mostrar esta tela',
    )
    expect(screen.getByRole('button', { name: 'Recarregar o app' })).toBeInTheDocument()
    spy.mockRestore()
  })

  it('não interfere quando nada quebra', () => {
    render(
      <ErrorBoundary>
        <p>tudo certo</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('tudo certo')).toBeInTheDocument()
  })
})
