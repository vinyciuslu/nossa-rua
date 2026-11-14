import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField, TextAreaField, TextField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { PlaceSelect } from '../../components/ui/PlaceSelect.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx'
import { APP_NAME } from '../../config/appConfig.js'
import { useSession } from '../../context/SessionContext.jsx'
import {
  NOTICE_DESCRIPTION_MAX,
  NOTICE_LEVELS,
  NOTICE_TITLE_MAX,
  noticeSchema,
} from '../../domain/adminSchemas.js'
import { CITIES, formatPlace, getCity } from '../../domain/places.js'
import { formatDateTime } from '../../utils/format.js'
import {
  listAdminNotices,
  publishNotice,
  retireNotice,
} from '../../services/adminService.js'

const EMPTY = {
  level: 'info',
  title: '',
  description: '',
  scope: 'city',
  cityId: '',
  neighborhoodId: '',
}

const levelLabel = (id) => NOTICE_LEVELS.find((l) => l.id === id)?.label ?? id
const where = (notice) =>
  notice.neighborhoodId
    ? formatPlace(notice.neighborhoodId)
    : `${getCity(notice.cityId)?.name ?? 'Município'} (município inteiro)`

function NoticeForm({ onPublished }) {
  const { account } = useSession()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  })
  const scope = useWatch({ control, name: 'scope' })
  const title = useWatch({ control, name: 'title' }) ?? ''
  const description = useWatch({ control, name: 'description' }) ?? ''

  async function onSubmit(values) {
    setServerError(null)
    try {
      const notice = await publishNotice({ admin: account, ...values })
      reset(EMPTY)
      onPublished(notice)
      await queryClient.invalidateQueries()
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="notice-form-title"
      className="hairline flex flex-col gap-4 rounded-card border-line bg-surface p-4"
    >
      <h2 id="notice-form-title" className="font-display text-lg font-bold">
        Novo aviso
      </h2>

      <SelectField
        label="Nível"
        required
        error={errors.level?.message}
        {...register('level')}
      >
        {NOTICE_LEVELS.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </SelectField>

      <TextField
        label="Título"
        required
        hint={`${title.trim().length}/${NOTICE_TITLE_MAX}`}
        error={errors.title?.message}
        {...register('title')}
      />
      <TextAreaField
        label="Descrição"
        required
        rows={4}
        hint={`${description.trim().length}/${NOTICE_DESCRIPTION_MAX}`}
        error={errors.description?.message}
        {...register('description')}
      />

      <SelectField label="Quem recebe" required {...register('scope')}>
        <option value="city">Um município inteiro</option>
        <option value="neighborhood">Um bairro</option>
      </SelectField>

      {scope === 'city' ? (
        <SelectField
          label="Município"
          required
          error={errors.cityId?.message}
          {...register('cityId')}
        >
          <option value="">Escolha o município</option>
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <Controller
          control={control}
          name="neighborhoodId"
          render={({ field, fieldState }) => (
            <PlaceSelect
              required
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
      )}

      <Notice tone="warn">
        <p>
          O aviso aparece na comunidade de quem mora ou acompanha o local, com a marca de
          demonstração. Nenhum aviso real é enviado a ninguém.
        </p>
      </Notice>

      {serverError && (
        <Notice tone="danger" title="Não foi possível publicar">
          <p>{serverError}</p>
        </Notice>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Publicando…' : 'Publicar aviso'}
      </Button>
    </form>
  )
}

/** Avisos oficiais: publicar para um município ou bairro e retirar os já publicados. */
export function NoticesPage() {
  const { account } = useSession()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState(null)
  const [removeError, setRemoveError] = useState(null)
  const query = useQuery({
    queryKey: ['admin', 'notices'],
    queryFn: () => listAdminNotices(account),
  })

  useEffect(() => {
    document.title = `Avisos · Painel · ${APP_NAME}`
  }, [])

  async function remove(notice) {
    setRemoveError(null)
    try {
      await retireNotice({ admin: account, noticeId: notice.id })
      setFeedback(`Aviso "${notice.title}" retirado.`)
      await queryClient.invalidateQueries()
    } catch (error) {
      setRemoveError(error.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Avisos oficiais</h1>
        <p className="mt-1 max-w-prose text-ink-muted">
          Mensagens da administração para um município inteiro ou para um bairro.
        </p>
      </div>

      <div role="status">
        {feedback && (
          <Notice tone="info" title="Feito">
            <p>{feedback}</p>
          </Notice>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <NoticeForm onPublished={(n) => setFeedback(`Aviso "${n.title}" publicado.`)} />

        <section aria-labelledby="published-title" className="flex flex-col gap-3">
          <h2 id="published-title" className="font-display text-lg font-bold">
            Publicados por você
          </h2>
          {query.isPending && <Skeleton className="h-24 w-full" />}
          {query.isError && (
            <ErrorState
              title="Não foi possível carregar os avisos"
              message={query.error.message}
              onRetry={() => query.refetch()}
            />
          )}
          {removeError && (
            <Notice tone="danger" title="Não foi possível retirar">
              <p>{removeError}</p>
            </Notice>
          )}
          {query.isSuccess && query.data.length === 0 && (
            <EmptyState
              title="Nenhum aviso publicado"
              description="Os avisos que você publicar aparecem aqui."
            />
          )}
          {query.isSuccess && query.data.length > 0 && (
            <ul className="flex flex-col gap-3">
              {query.data.map((notice) => (
                <li
                  key={notice.id}
                  className="hairline flex flex-col gap-2 rounded-card border-line bg-surface p-4"
                >
                  <p className="text-sm font-bold text-ink-muted">
                    {levelLabel(notice.level)} · {where(notice)}
                  </p>
                  <p className="font-bold">{notice.title}</p>
                  <p className="text-sm">{notice.description}</p>
                  <p className="text-sm text-ink-muted">
                    Publicado em {formatDateTime(notice.createdAt)}
                  </p>
                  <Button
                    variant="secondary"
                    className="self-start"
                    aria-label={`Retirar o aviso ${notice.title}`}
                    onClick={() => remove(notice)}
                  >
                    Retirar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
