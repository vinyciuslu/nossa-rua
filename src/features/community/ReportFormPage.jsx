import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Send } from 'lucide-react'
import { EmptyIllustration } from '../../components/illustrations/Illustrations.jsx'
import { Page } from '../../components/layout/Page.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField, TextAreaField, TextField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { PhotoField } from '../../components/ui/PhotoField.jsx'
import { EmptyState } from '../../components/ui/States.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useClock } from '../../context/ClockContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { can } from '../../domain/account.js'
import {
  REPORT_DESCRIPTION_MAX,
  REPORT_TITLE_MAX,
  reportSchema,
} from '../../domain/postSchemas.js'
import { REPORT_CATEGORIES, getCategory } from '../../domain/reportCategories.js'
import { formatPlace } from '../../domain/places.js'
import { createReport, findSimilar } from '../../services/postService.js'
import { useDebouncedValue } from '../../utils/useDebouncedValue.js'
import { SimilarReports } from './SimilarReports.jsx'
import { useSupport } from './useSupport.js'

/** Relatar um problema: categoria, bairro, texto e foto, com sugestão de relatos parecidos. */
export function ReportFormPage() {
  const { account } = useSession()
  const { now } = useClock()
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const support = useSupport()

  const followed = useMemo(() => account.followedPlaces, [account])
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: '',
      neighborhoodId: followed[0]?.neighborhoodId ?? '',
      title: '',
      description: '',
      photo: null,
    },
    mode: 'onTouched',
  })

  const category = useWatch({ control, name: 'category' })
  const neighborhoodId = useWatch({ control, name: 'neighborhoodId' })
  const title = useWatch({ control, name: 'title' })
  const description = useWatch({ control, name: 'description' })
  const photoRequired = category ? getCategory(category).photoRequired : false

  const draft = useDebouncedValue({ category, neighborhoodId, title, description }, 600)
  const canSearch = Boolean(
    draft.category && draft.neighborhoodId && draft.title.trim().length >= 5,
  )
  const similar = useQuery({
    queryKey: ['similar', draft, account.id],
    queryFn: () => findSimilar({ ...draft, accountId: account.id }),
    enabled: canSearch,
  })

  const publish = useMutation({
    mutationFn: (values) => createReport({ account, ...values }),
    onSuccess: (post) => {
      queryClient.invalidateQueries()
      toast.show('Relato publicado', { tone: 'success' })
      navigate(`/publicacao/${post.id}`, { replace: true })
    },
  })

  if (!can(account, 'report')) {
    return (
      <Page title="Relatar um problema" backTo="/inicio" backLabel="Voltar ao início">
        <Notice tone="info">
          <p>Só contas de morador publicam relatos. Contas de comércio criam anúncios.</p>
        </Notice>
      </Page>
    )
  }

  if (followed.length === 0) {
    return (
      <Page title="Relatar um problema" backTo="/inicio" backLabel="Voltar ao início">
        <EmptyState
          illustration={<EmptyIllustration />}
          title="Escolha um bairro primeiro"
          description="Relatos são publicados em um dos bairros que você acompanha."
          action={
            <Link to="/perfil/bairros" className="font-bold text-primary underline">
              Escolher bairros
            </Link>
          }
        />
      </Page>
    )
  }

  return (
    <Page
      title="Relatar um problema"
      description="Descreva o que você viu. Outros moradores poderão apoiar o relato."
      backTo="/inicio"
      backLabel="Voltar ao início"
    >
      <form
        noValidate
        onSubmit={handleSubmit((values) => publish.mutate(values))}
        className="flex flex-col gap-4"
      >
        <SelectField
          label="Categoria"
          required
          error={errors.category?.message}
          hint={
            category
              ? photoRequired
                ? 'Nesta categoria a foto é obrigatória.'
                : 'Nesta categoria a foto é opcional.'
              : undefined
          }
          {...register('category')}
        >
          <option value="">Escolha a categoria</option>
          {REPORT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Bairro"
          required
          error={errors.neighborhoodId?.message}
          {...register('neighborhoodId')}
        >
          {followed.map((f) => (
            <option key={f.neighborhoodId} value={f.neighborhoodId}>
              {f.label} · {formatPlace(f.neighborhoodId)}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Título"
          required
          maxLength={REPORT_TITLE_MAX}
          hint="Resuma o problema em poucas palavras."
          error={errors.title?.message}
          {...register('title')}
        />
        <TextAreaField
          label="Descrição"
          required
          maxLength={REPORT_DESCRIPTION_MAX}
          hint={`O que aconteceu, onde fica e desde quando. ${description.length} de ${REPORT_DESCRIPTION_MAX} caracteres.`}
          error={errors.description?.message}
          {...register('description')}
        />

        <SimilarReports
          reports={similar.data ?? []}
          now={now}
          accountId={account.id}
          pendingId={support.pendingId}
          onSupport={(report) => {
            support.toggle(report)
          }}
        />

        <Controller
          name="photo"
          control={control}
          render={({ field }) => (
            <PhotoField
              value={field.value}
              onChange={field.onChange}
              required={photoRequired}
              hint="A foto é reduzida e perde os dados de localização (GPS) antes de ser salva. Fica só neste aparelho."
              error={errors.photo?.message}
            />
          )}
        />

        {publish.isError && (
          <Notice tone="danger" title="Não foi possível publicar">
            <p>{publish.error.message}</p>
          </Notice>
        )}
        <Button type="submit" icon={Send} disabled={publish.isPending}>
          {publish.isPending ? 'Publicando…' : 'Publicar relato'}
        </Button>
      </form>
    </Page>
  )
}
