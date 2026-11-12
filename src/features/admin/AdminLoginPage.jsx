import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { LogIn } from 'lucide-react'
import { Logo } from '../../components/layout/Logo.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { TextField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { APP_NAME } from '../../config/appConfig.js'
import { DEMO_ACCOUNTS, DEMO_ADMIN_PASSWORD } from '../../config/demoAccounts.js'
import { useSession } from '../../context/SessionContext.jsx'
import { adminLoginSchema } from '../../domain/accountSchemas.js'

/** Acesso administrativo, separado do login de moradores (/admin/login). */
export function AdminLoginPage() {
  const { signInAdmin } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  useEffect(() => {
    document.title = `Acesso administrativo · ${APP_NAME}`
  }, [])

  async function onSubmit(values) {
    setServerError(null)
    try {
      await signInAdmin(values)
      navigate(location.state?.from?.pathname ?? '/admin', { replace: true })
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4 text-ink">
      <main className="flex w-full max-w-md flex-col gap-5">
        <Logo />
        <h1 className="font-display text-2xl font-bold">Acesso administrativo</h1>

        <Notice tone="info" title="Dados de demonstração">
          <p>
            E-mail: <strong>{DEMO_ACCOUNTS.admin.email}</strong>
          </p>
          <p>
            Senha: <strong>{DEMO_ADMIN_PASSWORD}</strong>
          </p>
          <p>
            Protótipo: não há segurança real, e nada aqui representa um órgão público.
          </p>
        </Notice>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <TextField
            label="E-mail"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {serverError && (
            <Notice tone="danger" title="Não foi possível entrar">
              <p>{serverError}</p>
            </Notice>
          )}
          <Button type="submit" icon={LogIn} disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <Link
          to="/entrar"
          className="min-h-(--tap-min) content-center font-bold text-primary underline"
        >
          Voltar ao app de moradores
        </Link>
      </main>
    </div>
  )
}
