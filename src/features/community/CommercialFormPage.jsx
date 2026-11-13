import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Megaphone } from 'lucide-react'
import { Page } from '../../components/layout/Page.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField, TextAreaField, TextField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { can } from '../../domain/account.js'
import { MAX_COMMERCIAL_PER_WEEK } from '../../domain/commercialLimits.js'
import { getNeighborhood, getCity } from '../../domain/places.js'
import {
  REPORT_DESCRIPTION_MAX,
  REPORT_TITLE_MAX,
  commercialSchema,
} from '../../domain/postSchemas.js'
import { createCommercialPost, getCommercialStatus } from '../../services/postService.js'
import { clock } from '../../services/clock.js'

/** Anúncio de comércio local. Sempre aparece como "Publicidade", com limites de frequência e de município. */
export function CommercialFormPage() {
  const { account } = useSession()
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const city = getCity(getNeighborhood(account.neighborhoodId)?.cityId)
  const neighborhoods = city?.neighborhoods ?? []
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(commercialSchema),
    defaultValues: {
      neighborhoodId: account.neighborhoodId ?? '',
      title: '',
      description: '',
    },
    mode: 'onTouched',
  })
  const neighborhoodId = useWatch({ control, name: 'neighborhoodId' })
  const description = useWatch({ control, name: 'description' })

  // O offset do relógio entra na chave: adiantar o tempo pode liberar novos anúncios.
  const limit = useQuery({
    queryKey: ['commercial-limit', account.id, neighborhoodId, clock.getOffset()],
    queryFn: () => getCommercialStatus({ account, neighborhoodId }),
    enabled: Boolean(neighborhoodId),
  })

  const publish = useMutation({
    mutationFn: (values) => createCommercialPost({ account, ...values }),
    onSuccess: (post) => {
      queryClient.invalidateQueries()
      toast.show('Anúncio publicado', { tone: 'success' })
      navigate(`/publicacao/${post.id}`, { replace: true })
    },
  })

  if (!can(account, 'publish_commercial')) {
    return (
      <Page title="Criar anúncio" backTo="/inicio" backLabel="Voltar ao início">
        <Notice tone="info">
          <p>Só contas de comércio local criam anúncios. Moradores publicam relatos.</p>
        </Notice>
      </Page>
    )
  }

  const blocked = limit.data && !limit.data.ok

  return (
    <Page
      title="Criar anúncio"
      description={`Divulgue seu comércio para os moradores de ${city?.name ?? 'sua cidade'}.`}
      backTo="/inicio"
      backLabel="Voltar ao início"
    >
      <Notice tone="info" title="Regras dos anúncios">
        <p>
          Todo anúncio aparece identificado como "Publicidade", com o nome do seu
          comércio.
        </p>
        <p>
          Limite de {MAX_COMMERCIAL_PER_WEEK} anúncios a cada 7 dias, só em bairros de{' '}
          {city?.name}.
        </p>
      </Notice>

      <form
        noValidate
        onSubmit={handleSubmit((values) => publish.mutate(values))}
        className="flex flex-col gap-4"
      >
        <SelectField
          label="Bairro do anúncio"
          required
          error={errors.neighborhoodId?.message}
          {...register('neighborhoodId')}
        >
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Título"
          required
          maxLength={REPORT_TITLE_MAX}
          error={errors.title?.message}
          {...register('title')}
        />
        <TextAreaField
          label="Texto do anúncio"
          required
          maxLength={REPORT_DESCRIPTION_MAX}
          hint={`${description.length} de ${REPORT_DESCRIPTION_MAX} caracteres.`}
          error={errors.description?.message}
          {...register('description')}
        />

        {blocked && (
          <Notice tone="warn" title="Limite de anúncios">
            <p>{limit.data.error}</p>
          </Notice>
        )}
        {publish.isError && (
          <Notice tone="danger" title="Não foi possível publicar">
            <p>{publish.error.message}</p>
          </Notice>
        )}
        <Button type="submit" icon={Megaphone} disabled={publish.isPending || blocked}>
          {publish.isPending ? 'Publicando…' : 'Publicar anúncio'}
        </Button>
      </form>
    </Page>
  )
}
