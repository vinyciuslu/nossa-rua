import { useQuery } from '@tanstack/react-query'
import { useClock } from '../../context/ClockContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { getAdminReport, listAdminReports } from '../../services/adminService.js'

/** Fila completa, já ordenada por prioridade. A espera depende do relógio, por isso ele entra na chave. */
export function useAdminReports() {
  const { account } = useSession()
  const { offsetMs } = useClock()
  return useQuery({
    queryKey: ['admin', 'reports', { offsetMs }],
    queryFn: () => listAdminReports(account),
  })
}

export function useAdminReport(id) {
  const { account } = useSession()
  const { offsetMs } = useClock()
  return useQuery({
    queryKey: ['admin', 'report', id, { offsetMs }],
    queryFn: () => getAdminReport(account, id),
    retry: false,
  })
}
