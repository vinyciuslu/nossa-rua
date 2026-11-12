import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Trash2 } from 'lucide-react'
import { Page } from '../../components/layout/Page.jsx'
import { BottomSheet } from '../../components/ui/BottomSheet.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { RadioCard } from '../../components/ui/RadioCard.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { AUTHOR_DISPLAY, getAuthorLabel } from '../../domain/account.js'
import { downloadJson } from '../../utils/download.js'
import { AccessibilitySettings } from './AccessibilitySettings.jsx'

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-display text-lg font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function SettingsPage() {
  const { account, updateAccount, deleteAccount, exportAccountData } = useSession()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const isCompany = account.type === 'cnpj'

  async function setAuthorDisplay(authorDisplay) {
    setError(null)
    try {
      await updateAccount({ privacy: { ...account.privacy, authorDisplay } })
      toast.show('Privacidade atualizada', { tone: 'success' })
    } catch (e) {
      setError(e.message)
    }
  }

  async function onExport() {
    setError(null)
    try {
      downloadJson(await exportAccountData(), 'nossa-rua-meus-dados.json')
    } catch (e) {
      setError(e.message)
    }
  }

  async function onDelete() {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount()
      navigate('/entrar', { replace: true })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Page title="Configurações" backTo="/perfil" backLabel="Voltar ao perfil">
      <Section id="a11y-title" title="Acessibilidade">
        <AccessibilitySettings />
      </Section>

      <Section id="privacy-title" title="Privacidade">
        {isCompany ? (
          <p className="text-ink-muted">
            Publicações de comércio sempre mostram o nome do comércio, porque publicidade
            precisa dizer quem anuncia.
          </p>
        ) : (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 font-bold text-ink">
              Como seu nome aparece nos relatos
            </legend>
            {Object.entries(AUTHOR_DISPLAY).map(([id, option]) => (
              <RadioCard
                key={id}
                name="authorDisplay"
                value={id}
                checked={(account.privacy?.authorDisplay ?? 'neighborhood') === id}
                onChange={() => setAuthorDisplay(id)}
                title={option.label}
                description={`Ficaria assim: ${getAuthorLabel({
                  ...account,
                  privacy: { ...account.privacy, authorDisplay: id },
                })}`}
              />
            ))}
          </fieldset>
        )}
        <Notice tone="info">
          <p>No protótipo, as permissões e a privacidade são apenas simuladas.</p>
        </Notice>
      </Section>

      <Section id="data-title" title="Seus dados">
        <p className="text-ink-muted">
          Tudo fica somente neste aparelho. O app não guarda CPF, CNPJ nem senha.
        </p>
        {error && (
          <Notice tone="danger">
            <p>{error}</p>
          </Notice>
        )}
        <Button variant="secondary" icon={Download} onClick={onExport}>
          Baixar meus dados
        </Button>
        <Button variant="secondary" icon={Trash2} onClick={() => setConfirmOpen(true)}>
          Excluir minha conta
        </Button>
      </Section>

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Excluir sua conta?"
      >
        <div className="flex flex-col gap-4">
          <p>
            Sua conta e as preferências dela serão apagadas deste aparelho. Isso não pode
            ser desfeito.
            {account.demo &&
              ' Como é uma conta de demonstração, ela volta zerada no próximo uso.'}
          </p>
          <Button variant="accent" icon={Trash2} disabled={busy} onClick={onDelete}>
            {busy ? 'Excluindo…' : 'Sim, excluir minha conta'}
          </Button>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
        </div>
      </BottomSheet>
    </Page>
  )
}
