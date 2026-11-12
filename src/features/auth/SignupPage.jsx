import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Dices, UserPlus } from 'lucide-react'
import { Page } from '../../components/layout/Page.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { CheckboxField, TextField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { PlaceSelect } from '../../components/ui/PlaceSelect.jsx'
import { RadioCard } from '../../components/ui/RadioCard.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { signupSchema } from '../../domain/accountSchemas.js'
import { ACCOUNT_TYPES } from '../../domain/account.js'
import {
  formatCnpj,
  formatCpf,
  generateCnpj,
  generateCpf,
} from '../../domain/document.js'

const TYPE_OPTIONS = ['cpf', 'cnpj']

export function SignupPage() {
  const { signUp } = useSession()
  const toast = useToast()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      type: 'cpf',
      name: '',
      businessName: '',
      email: '',
      document: '',
      neighborhoodId: '',
      acceptedTerms: false,
    },
    mode: 'onTouched',
  })

  const type = useWatch({ control, name: 'type' })
  const isCompany = type === 'cnpj'
  const format = isCompany ? formatCnpj : formatCpf
  const documentLabel = isCompany ? 'CNPJ fictício' : 'CPF fictício'

  async function onSubmit(values) {
    setServerError(null)
    try {
      // O documento foi só validado: não segue para o serviço.
      const { type, name, businessName, email, neighborhoodId } = values
      await signUp({ type, name, businessName, email, neighborhoodId })
      toast.show('Conta de demonstração criada', { tone: 'success' })
      navigate('/perfil', { replace: true })
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <Page
      title="Criar conta"
      description="Cadastro de demonstração, só para testar o app."
      backTo="/entrar"
      backLabel="Voltar para entrar"
    >
      <Notice tone="warn" title="Não use dados reais">
        <p>
          O número do documento é apenas conferido e descartado: o app não o guarda, nem
          uma versão codificada dele. Use o botão para gerar um número fictício.
        </p>
      </Notice>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-bold text-ink">Tipo de conta</legend>
          {TYPE_OPTIONS.map((option) => (
            <RadioCard
              key={option}
              value={option}
              title={`${ACCOUNT_TYPES[option].label} · ${option === 'cpf' ? 'CPF' : 'CNPJ'}`}
              description={ACCOUNT_TYPES[option].description}
              {...register('type', {
                onChange: () => setValue('document', '', { shouldValidate: false }),
              })}
            />
          ))}
        </fieldset>

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
            required
            hint="Aparece nas publicações do seu comércio, sempre identificadas como publicidade."
            error={errors.businessName?.message}
            {...register('businessName')}
          />
        )}
        <TextField
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          hint="Use um e-mail fictício. Fica somente neste aparelho."
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="flex flex-col gap-2">
          <TextField
            label={documentLabel}
            required
            inputMode="numeric"
            autoComplete="off"
            error={errors.document?.message}
            {...register('document', {
              onChange: (e) => setValue('document', format(e.target.value)),
            })}
          />
          <Button
            variant="secondary"
            icon={Dices}
            onClick={() =>
              setValue('document', isCompany ? generateCnpj() : generateCpf(), {
                shouldValidate: true,
              })
            }
          >
            Gerar {isCompany ? 'CNPJ' : 'CPF'} fictício
          </Button>
        </div>

        <Controller
          name="neighborhoodId"
          control={control}
          render={({ field }) => (
            <PlaceSelect
              required
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.neighborhoodId?.message}
            />
          )}
        />

        <CheckboxField
          label="Entendo que é um protótipo: os dados são fictícios e ficam só neste aparelho."
          error={errors.acceptedTerms?.message}
          {...register('acceptedTerms')}
        />

        {serverError && (
          <Notice tone="danger" title="Não foi possível criar a conta">
            <p>{serverError}</p>
          </Notice>
        )}
        <Button type="submit" icon={UserPlus} disabled={isSubmitting}>
          {isSubmitting ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-bold text-primary underline">
          Entrar
        </Link>
      </p>
    </Page>
  )
}
