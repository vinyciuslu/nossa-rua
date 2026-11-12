import { Page } from '../../components/layout/Page.jsx'
import { AccessibilitySettings } from './AccessibilitySettings.jsx'

/** Rota pública (/acessibilidade): quem precisa de ajustes não deveria ter que entrar antes. */
export function AccessibilityPage() {
  return (
    <Page
      title="Acessibilidade"
      description="As escolhas valem para este aparelho e ficam salvas."
      backTo="/entrar"
      backLabel="Voltar"
    >
      <AccessibilitySettings />
    </Page>
  )
}
