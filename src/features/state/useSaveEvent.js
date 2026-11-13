import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { can } from '../../domain/account.js'
import { toggleSavedEvent } from '../../services/stateService.js'

/**
 * Salvar um evento, com as regras de quem pode:
 *  - visitante: vai para "Entrar" e volta depois;
 *  - morador ou comércio: salva ou remove.
 */
export function useSaveEvent() {
  const { account } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: toggleSavedEvent,
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['state'] })
      toast.show(event.saved ? 'Evento salvo.' : 'Evento removido dos salvos.', {
        tone: 'info',
      })
    },
    onError: (error) => toast.show(error.message, { tone: 'danger' }),
  })

  return {
    pendingId: mutation.isPending ? mutation.variables.eventId : null,
    toggle(event) {
      if (!account) {
        toast.show('Entre para salvar eventos.', { tone: 'info' })
        navigate('/entrar', { state: { from: location } })
        return
      }
      if (!can(account, 'save_event')) {
        toast.show('Esta conta não pode salvar eventos.', { tone: 'info' })
        return
      }
      mutation.mutate({ eventId: event.id, accountId: account.id })
    },
  }
}
