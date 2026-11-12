import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AccessibilityProvider } from '../context/AccessibilityContext.jsx'
import { AppShell } from '../components/layout/AppShell.jsx'
import { PhoneFrame } from '../components/layout/PhoneFrame.jsx'
import { ErrorState } from '../components/ui/States.jsx'
import { ToastProvider } from '../components/ui/Toast.jsx'
import { DesignSystemPage } from '../features/dev/DesignSystemPage.jsx'
import { CommunityFeedPage } from '../features/community/CommunityFeedPage.jsx'
import { MapPage } from '../features/map/MapPage.jsx'
import { ProfilePage } from '../features/profile/ProfilePage.jsx'
import { StateFeedPage } from '../features/state/StateFeedPage.jsx'

/** Tudo que aparece dentro da moldura de smartphone (ou em tela cheia no celular). */
function PhoneLayout() {
  return (
    <PhoneFrame>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </PhoneFrame>
  )
}

export function App() {
  return (
    <AccessibilityProvider>
      <BrowserRouter>
        <Routes>
          {/* Guia de estilo: página comum, fora da moldura. */}
          <Route path="/dev/design-system" element={<DesignSystemPage />} />

          <Route element={<PhoneLayout />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            <Route path="inicio" element={<CommunityFeedPage />} />
            <Route path="estado" element={<StateFeedPage />} />
            <Route path="mapa" element={<MapPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route
              path="*"
              element={
                <ErrorState
                  title="Página não encontrada"
                  message="O endereço que você abriu não existe no app. Use a navegação abaixo para voltar."
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AccessibilityProvider>
  )
}
