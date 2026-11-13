import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { can } from '../../domain/account.js'
import { toggleSupport } from '../../services/postService.js'

/**
 * Ação de apoiar um relato, com as regras de quem pode:
 *  - visitante: vai para "Entrar" e volta depois;
 *  - conta de comércio: recebe um aviso (só moradores apoiam relatos);
 *  - morador: apoia ou retira o apoio.
 */
export function useSupport() {
  const { account } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: toggleSupport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
    onError: (error) => toast.show(error.message, { tone: 'danger' }),
  })

  return {
    pendingId: mutation.isPending ? mutation.variables.postId : null,
    toggle(post) {
      if (!account) {
        toast.show('Entre para apoiar relatos.', { tone: 'info' })
        navigate('/entrar', { state: { from: location } })
        return
      }
      if (!can(account, 'support')) {
        toast.show('Só contas de morador apoiam relatos.', { tone: 'info' })
        return
      }
      mutation.mutate({ postId: post.id, accountId: account.id })
    },
  }
}
