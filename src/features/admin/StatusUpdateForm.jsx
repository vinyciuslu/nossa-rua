import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField, TextAreaField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { makeStatusUpdateSchema } from '../../domain/adminSchemas.js'
import {
  STATUS_NOTE_MAX,
  STATUS_NOTE_MIN,
  STATUSES_REQUIRING_NOTE,
  nextStatusOptions,
} from '../../domain/reportStatus.js'
import { updateReportStatus } from '../../services/adminService.js'

/**
 * Atualização de status. Recebe `key={status}` de quem usa: quando o status muda
 * o formulário nasce de novo, com as opções e as regras da nova etapa. Por isso o
 * aviso de "registrado" fica com quem usa (`onUpdated`), que não é recriado.
 */
export function StatusUpdateForm({ report, onUpdated }) {
  const { account } = useSession()
  const queryClient = useQueryClient()
  const options = nextStatusOptions(report.status)
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(makeStatusUpdateSchema(report.status)),
    defaultValues: { status: '', note: '' },
    mode: 'onTouched',
  })
  const status = useWatch({ control, name: 'status' })
  const note = useWatch({ control, name: 'note' }) ?? ''
  const noteRequired = STATUSES_REQUIRING_NOTE.includes(status)

  async function onSubmit(values) {
    setServerError(null)
    try {
      const updated = await updateReportStatus({
        admin: account,
        postId: report.id,
        ...values,
      })
      onUpdated(options.find((o) => o.id === updated.status)?.label)
      // A fila, o detalhe e o que o morador vê dependem deste relato.
      await queryClient.invalidateQueries()
    } catch (error) {
      setServerError(error.message)
    }
  }

  if (options.length === 0) {
    return (
      <Notice tone="info" title="Relato encerrado">
        <p>
          Um relato resolvido ou não procedente não pode mais ser alterado, e o tempo de
          espera deixou de contar.
        </p>
      </Notice>
    )
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="update-title"
      className="hairline flex flex-col gap-4 rounded-card border-line bg-surface p-4"
    >
      <h2 id="update-title" className="font-display text-lg font-bold">
        Atualizar status
      </h2>

      <SelectField
        label="Nova etapa"
        required
        error={errors.status?.message}
        {...register('status')}
      >
        <option value="">Escolha a nova etapa</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        label={
          noteRequired
            ? 'Nota para o morador (obrigatória)'
            : 'Nota para o morador (opcional)'
        }
        hint={
          noteRequired
            ? `Explique em pelo menos ${STATUS_NOTE_MIN} letras. ${note.trim().length}/${STATUS_NOTE_MAX}`
            : `Aparece na linha do tempo do relato. ${note.trim().length}/${STATUS_NOTE_MAX}`
        }
        rows={3}
        error={errors.note?.message}
        {...register('note')}
      />

      <Notice tone="warn">
        <p>
          A nota é pública. Ao registrar, a simulação automática deste relato para, e a
          ação não pode ser desfeita.
        </p>
      </Notice>

      {serverError && (
        <Notice tone="danger" title="Não foi possível registrar">
          <p>{serverError}</p>
        </Notice>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registrando…' : 'Registrar atualização'}
      </Button>
    </form>
  )
}
