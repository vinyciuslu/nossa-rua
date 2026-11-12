import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { LogIn, Store, UserRound } from 'lucide-react'
import { Page } from '../../components/layout/Page.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { TextField } from '../../components/ui/FormFields.jsx'
import { Notice } from '../../components/ui/Notice.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { loginSchema } from '../../domain/accountSchemas.js'

export function LoginPage() {
  const { signIn, signInDemo } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  })

  const destination = location.state?.from?.pathname ?? '/perfil'

  async function run(action) {
    setServerError(null)
    try {
      await action()
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <Page title="Entrar" description="Acompanhe os relatos dos seus bairros.">
      <Notice tone="info" title="Isto é um protótipo">
        <p>
          Não existe senha: a conta é identificada pelo e-mail e fica somente neste
          aparelho. Use e-mails e dados fictícios.
        </p>
      </Notice>

      <form
        noValidate
        onSubmit={handleSubmit((values) => run(() => signIn(values)))}
        className="flex flex-col gap-4"
      >
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
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

      <section aria-labelledby="demo-title" className="flex flex-col gap-3">
        <h2 id="demo-title" className="font-display text-lg font-bold">
          Ou teste com uma conta de demonstração
        </h2>
        <Button
          variant="secondary"
          icon={UserRound}
          onClick={() => run(() => signInDemo('resident'))}
        >
          Entrar como morador(a)
        </Button>
        <Button
          variant="secondary"
          icon={Store}
          onClick={() => run(() => signInDemo('business'))}
        >
          Entrar como comércio local
        </Button>
      </section>

      <nav
        aria-label="Outras opções"
        className="flex flex-col gap-1 font-bold text-primary"
      >
        <Link to="/cadastro" className="min-h-(--tap-min) content-center underline">
          Criar uma conta
        </Link>
        <Link to="/acessibilidade" className="min-h-(--tap-min) content-center underline">
          Ajustar cores e tamanho dos ícones
        </Link>
        <Link to="/admin/login" className="min-h-(--tap-min) content-center underline">
          Acesso administrativo
        </Link>
      </nav>
    </Page>
  )
}
