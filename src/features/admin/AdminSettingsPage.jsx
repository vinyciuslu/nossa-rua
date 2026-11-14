import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button.jsx'
import { TextField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { APP_NAME } from '../../config/appConfig.js'
import { useSession } from '../../context/SessionContext.jsx'
import { DEFAULT_THRESHOLDS, validateThresholds } from '../../domain/traffic.js'
import {
  restoreTrafficThresholds,
  updateTrafficThresholds,
} from '../../services/adminService.js'
import { getTrafficThresholds } from '../../services/settingsService.js'

function ThresholdsForm({ current }) {
  const { account } = useSession()
  const queryClient = useQueryClient()
  const [freeFrom, setFreeFrom] = useState(String(current.freeFrom))
  const [heavyBelow, setHeavyBelow] = useState(String(current.heavyBelow))
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)

  const numbers = { freeFrom: Number(freeFrom), heavyBelow: Number(heavyBelow) }
  const isDefault =
    current.freeFrom === DEFAULT_THRESHOLDS.freeFrom &&
    current.heavyBelow === DEFAULT_THRESHOLDS.heavyBelow

  async function run(action, message) {
    setBusy(true)
    setError(null)
    setFeedback(null)
    try {
      await action()
      setFeedback(message)
      // o mapa de todos os municípios depende destes limites
      await queryClient.invalidateQueries()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  function submit(event) {
    event.preventDefault()
    const problem = validateThresholds(numbers)
    if (problem) {
      setFeedback(null)
      setError(problem)
      return
    }
    run(
      () => updateTrafficThresholds({ admin: account, ...numbers }),
      'Limites salvos. O mapa já usa os novos valores.',
    )
  }

  async function restore() {
    await run(() => restoreTrafficThresholds(account), 'Limites padrão restaurados.')
    setFreeFrom(String(DEFAULT_THRESHOLDS.freeFrom))
    setHeavyBelow(String(DEFAULT_THRESHOLDS.heavyBelow))
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="thresholds-title"
      className="hairline flex max-w-xl flex-col gap-4 rounded-card border-line bg-surface p-4"
    >
      <h2 id="thresholds-title" className="font-display text-lg font-bold">
        Limites do trânsito
      </h2>
      <p className="text-sm text-ink-muted">
        Os percentuais são da velocidade normal do trecho. Acima do primeiro limite o
        trânsito é livre; abaixo do segundo, há congestionamento intenso; entre os dois, é
        moderado.
      </p>

      <TextField
        label="Trânsito livre a partir de (%)"
        type="number"
        inputMode="numeric"
        min="1"
        max="99"
        value={freeFrom}
        onChange={(e) => setFreeFrom(e.target.value)}
      />
      <TextField
        label="Congestionamento intenso abaixo de (%)"
        type="number"
        inputMode="numeric"
        min="1"
        max="99"
        value={heavyBelow}
        onChange={(e) => setHeavyBelow(e.target.value)}
      />

      <div role="status">
        {feedback && (
          <Notice tone="info" title="Feito">
            <p>{feedback}</p>
          </Notice>
        )}
      </div>
      {error && (
        <Notice tone="danger" title="Não foi possível salvar">
          <p>{error}</p>
        </Notice>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          Salvar limites
        </Button>
        <Button variant="secondary" disabled={busy || isDefault} onClick={restore}>
          Restaurar padrão ({DEFAULT_THRESHOLDS.freeFrom}% e{' '}
          {DEFAULT_THRESHOLDS.heavyBelow}
          %)
        </Button>
      </div>
    </form>
  )
}

/** Parâmetros ajustáveis do protótipo: hoje, os limites que classificam o trânsito. */
export function AdminSettingsPage() {
  useEffect(() => {
    document.title = `Parâmetros · Painel · ${APP_NAME}`
  }, [])
  const query = useQuery({
    queryKey: ['admin', 'thresholds'],
    queryFn: async () => getTrafficThresholds(),
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Parâmetros</h1>
        <p className="mt-1 max-w-prose text-ink-muted">
          Ajustes que mudam o comportamento do app neste navegador.
        </p>
      </div>
      {/* Sem `key`: remontar o formulário depois de salvar apagaria o aviso de sucesso. */}
      {query.isSuccess && <ThresholdsForm current={query.data} />}
    </div>
  )
}
