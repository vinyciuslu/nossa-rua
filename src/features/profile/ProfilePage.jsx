import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ChevronRight, FileText, LogOut, MapPin, Settings } from 'lucide-react'
import { Page } from '../../components/layout/Page.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { TextField } from '../../components/ui/FormFields.jsx'
import { Icon } from '../../components/ui/Icon.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { ACCOUNT_TYPES, getAuthorLabel } from '../../domain/account.js'
import { profileSchema } from '../../domain/accountSchemas.js'
import { formatPlace } from '../../domain/places.js'

function MenuLink({ to, icon, title, detail }) {
  return (
    <Link
      to={to}
      className="hairline flex min-h-(--tap-min) items-center gap-3 rounded-card border-line-strong bg-surface p-3.5"
    >
      <Icon icon={icon} className="text-primary" />
      <span className="flex flex-1 flex-col">
        <span className="font-bold text-ink">{title}</span>
        {detail && <span className="text-sm text-ink-muted">{detail}</span>}
      </span>
      <Icon icon={ChevronRight} className="text-ink-muted" />
    </Link>
  )
}

export function ProfilePage() {
  const { account, updateAccount, signOut } = useSession()
  const toast = useToast()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)
  const isCompany = account.type === 'cnpj'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: account.name, businessName: account.businessName ?? '' },
    mode: 'onTouched',
  })

  async function onSubmit(values) {
    setServerError(null)
    try {
      const updated = await updateAccount(values)
      reset({ name: updated.name, businessName: updated.businessName ?? '' })
      toast.show('Perfil atualizado', { tone: 'success' })
    } catch (error) {
      setServerError(error.message)
    }
  }

  async function onSignOut() {
    await signOut()
    navigate('/entrar', { replace: true })
  }

  const followedCount = account.followedPlaces.length

  return (
    <Page title="Meu perfil">
      <div className="flex items-center gap-4">
        <Avatar name={account.name} size="lg" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="font-display text-lg font-bold break-words text-ink">
            {account.name}
          </p>
          <p className="text-sm break-all text-ink-muted">{account.email}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="info">{ACCOUNT_TYPES[account.type].label}</Badge>
            {account.demo && <Badge tone="neutral">Conta de demonstração</Badge>}
          </div>
        </div>
      </div>

      <section aria-labelledby="identity-title" className="flex flex-col gap-2">
        <h2 id="identity-title" className="font-display text-lg font-bold">
          Como você aparece
        </h2>
        <p className="hairline rounded-card border-line-strong bg-surface p-3.5 font-bold text-ink">
          {getAuthorLabel(account)}
        </p>
        <p className="text-sm text-ink-muted">
          É assim que seus relatos são identificados. Você pode mudar em{' '}
          <Link to="/perfil/configuracoes" className="font-bold text-primary underline">
            Configurações
          </Link>
          . No protótipo, essa privacidade é apenas simulada.
        </p>
        {account.neighborhoodId && (
          <p className="text-sm text-ink-muted">
            Bairro principal: {formatPlace(account.neighborhoodId)}
          </p>
        )}
      </section>

      <nav aria-label="Seções do perfil" className="flex flex-col gap-2">
        <MenuLink
          to="/perfil/publicacoes"
          icon={FileText}
          title={isCompany ? 'Meus anúncios' : 'Meus relatos'}
          detail={
            isCompany
              ? 'Anúncios que você criou'
              : 'Relatos que você criou e o andamento deles'
          }
        />
        <MenuLink
          to="/perfil/bairros"
          icon={MapPin}
          title="Bairros acompanhados"
          detail={followedCount === 1 ? '1 bairro' : `${followedCount} bairros`}
        />
        <MenuLink
          to="/perfil/configuracoes"
          icon={Settings}
          title="Configurações"
          detail="Acessibilidade, privacidade e dados"
        />
      </nav>

      <section aria-labelledby="edit-title" className="flex flex-col gap-3">
        <h2 id="edit-title" className="font-display text-lg font-bold">
          Editar dados
        </h2>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <TextField
            label={isCompany ? 'Nome do responsável' : 'Nome'}
            required
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          {isCompany && (
            <TextField
              label="Nome do comércio"
              error={errors.businessName?.message}
              {...register('businessName')}
            />
          )}
          {serverError && (
            <Notice tone="danger" title="Não foi possível salvar">
              <p>{serverError}</p>
            </Notice>
          )}
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </form>
      </section>

      <Button variant="secondary" icon={LogOut} onClick={onSignOut}>
        Sair
      </Button>
    </Page>
  )
}
