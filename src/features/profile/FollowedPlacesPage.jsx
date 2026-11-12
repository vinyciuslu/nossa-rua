import { useState } from 'react'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { Page } from '../../components/layout/Page.jsx'
import { Button, IconButton } from '../../components/ui/Button.jsx'
import { SelectField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { PlaceSelect } from '../../components/ui/PlaceSelect.jsx'
import { EmptyState } from '../../components/ui/States.jsx'
import { EmptyIllustration } from '../../components/illustrations/Illustrations.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import {
  MAX_FOLLOWED_PLACES,
  PLACE_LABELS,
  addFollowedPlace,
  relabelFollowedPlace,
  removeFollowedPlace,
} from '../../domain/followedPlaces.js'
import { formatPlace } from '../../domain/places.js'

/**
 * Bairros acompanhados, cada um com um rótulo (Casa, Trabalho, Faculdade, Outro).
 * Na Etapa 3 o feed da comunidade usará esta lista.
 */
export function FollowedPlacesPage() {
  const { account, updateAccount } = useSession()
  const toast = useToast()
  const [neighborhoodId, setNeighborhoodId] = useState('')
  const [label, setLabel] = useState('Outro')
  const [formKey, setFormKey] = useState(0)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const list = account.followedPlaces
  const full = list.length >= MAX_FOLLOWED_PLACES

  async function apply(result, successMessage) {
    if (result.error) {
      setError(result.error)
      return false
    }
    setError(null)
    setBusy(true)
    try {
      await updateAccount({ followedPlaces: result.list })
      toast.show(successMessage, { tone: 'success' })
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function onAdd(event) {
    event.preventDefault()
    const done = await apply(
      addFollowedPlace(list, { neighborhoodId, label }),
      'Bairro adicionado',
    )
    if (done) {
      setNeighborhoodId('')
      setFormKey((k) => k + 1) // reinicia os selects de município/bairro
    }
  }

  return (
    <Page
      title="Bairros acompanhados"
      description="Os relatos desses bairros aparecem no seu Início."
      backTo="/perfil"
      backLabel="Voltar ao perfil"
    >
      <section aria-labelledby="list-title" className="flex flex-col gap-3">
        <h2 id="list-title" className="font-display text-lg font-bold">
          Seus bairros ({list.length} de {MAX_FOLLOWED_PLACES})
        </h2>
        {list.length === 0 ? (
          <EmptyState
            illustration={<EmptyIllustration />}
            title="Nenhum bairro por aqui"
            description="Adicione um bairro para ver o que os moradores estão relatando nele."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((item) => {
              const place = formatPlace(item.neighborhoodId)
              return (
                <li
                  key={item.neighborhoodId}
                  className="hairline flex items-end gap-2 rounded-card border-line-strong bg-surface p-3.5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="flex items-center gap-2 font-bold text-ink">
                      <MapPin
                        aria-hidden="true"
                        className="size-(--icon-sm) shrink-0 text-primary"
                      />
                      {place}
                    </p>
                    <SelectField
                      label={`Rótulo de ${place}`}
                      value={item.label}
                      disabled={busy}
                      onChange={(e) =>
                        apply(
                          relabelFollowedPlace(list, item.neighborhoodId, e.target.value),
                          'Rótulo atualizado',
                        )
                      }
                    >
                      {PLACE_LABELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <IconButton
                    icon={Trash2}
                    label={`Remover ${place}`}
                    disabled={busy}
                    onClick={() =>
                      apply(
                        removeFollowedPlace(list, item.neighborhoodId),
                        'Bairro removido',
                      )
                    }
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="add-title" className="flex flex-col gap-3">
        <h2 id="add-title" className="font-display text-lg font-bold">
          Adicionar bairro
        </h2>
        {full ? (
          <Notice tone="info">
            <p>
              Você chegou ao limite de {MAX_FOLLOWED_PLACES} bairros. Remova um para
              adicionar outro.
            </p>
          </Notice>
        ) : (
          <form onSubmit={onAdd} className="flex flex-col gap-4">
            <PlaceSelect
              key={formKey}
              value={neighborhoodId}
              onChange={setNeighborhoodId}
            />
            <SelectField
              label="Rótulo"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            >
              {PLACE_LABELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </SelectField>
            <Button type="submit" icon={Plus} disabled={!neighborhoodId || busy}>
              Adicionar
            </Button>
          </form>
        )}
        {error && (
          <Notice tone="danger">
            <p>{error}</p>
          </Notice>
        )}
      </section>
    </Page>
  )
}
