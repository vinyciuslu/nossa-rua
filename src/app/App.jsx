import { createQueryClient } from './queryClient.js'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AccessibilityProvider } from '../context/AccessibilityContext.jsx'
import { ClockProvider } from '../context/ClockContext.jsx'
import { SessionProvider } from '../context/SessionContext.jsx'
import { AppShell } from '../components/layout/AppShell.jsx'
import { PhoneFrame } from '../components/layout/PhoneFrame.jsx'
import { ErrorState } from '../components/ui/States.jsx'
import { ToastProvider } from '../components/ui/Toast.jsx'
import { AdminHomePage } from '../features/admin/AdminHomePage.jsx'
import { AdminLayout } from '../features/admin/AdminLayout.jsx'
import { AdminLoginPage } from '../features/admin/AdminLoginPage.jsx'
import { LoginPage } from '../features/auth/LoginPage.jsx'
import { SignupPage } from '../features/auth/SignupPage.jsx'
import { DesignSystemPage } from '../features/dev/DesignSystemPage.jsx'
import { CommercialFormPage } from '../features/community/CommercialFormPage.jsx'
import { ReportFormPage } from '../features/community/ReportFormPage.jsx'
import { PostDetailPage } from '../features/community/PostDetailPage.jsx'
import { CommunityFeedPage } from '../features/community/CommunityFeedPage.jsx'
import { MapPage } from '../features/map/MapPage.jsx'
import { AccessibilityPage } from '../features/profile/AccessibilityPage.jsx'
import { FollowedPlacesPage } from '../features/profile/FollowedPlacesPage.jsx'
import { ProfilePage } from '../features/profile/ProfilePage.jsx'
import { SettingsPage } from '../features/profile/SettingsPage.jsx'
import { StateFeedPage } from '../features/state/StateFeedPage.jsx'
import {
  AdminGuestOnly,
  GuestOnly,
  RequireAdmin,
  RequireResident,
} from './RouteGuards.jsx'

const queryClient = createQueryClient()

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

/** Todas as rotas do app. Separadas dos provedores para poderem ser testadas com MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      {/* Guia de estilo: página comum, fora da moldura. */}
      <Route path="/dev/design-system" element={<DesignSystemPage />} />

      {/* Administração: página larga, fora da moldura, com login próprio. */}
      <Route element={<AdminGuestOnly />}>
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>
      <Route path="/admin" element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
        </Route>
      </Route>

      <Route element={<PhoneLayout />}>
        <Route index element={<Navigate to="/inicio" replace />} />
        <Route path="inicio" element={<CommunityFeedPage />} />
        <Route path="publicacao/:id" element={<PostDetailPage />} />
        <Route path="estado" element={<StateFeedPage />} />
        <Route path="mapa" element={<MapPage />} />
        <Route path="acessibilidade" element={<AccessibilityPage />} />
        <Route element={<GuestOnly />}>
          <Route path="entrar" element={<LoginPage />} />
          <Route path="cadastro" element={<SignupPage />} />
        </Route>
        <Route element={<RequireResident />}>
          <Route path="relatar" element={<ReportFormPage />} />
          <Route path="anunciar" element={<CommercialFormPage />} />
        </Route>
        <Route path="perfil" element={<RequireResident />}>
          <Route index element={<ProfilePage />} />
          <Route path="bairros" element={<FollowedPlacesPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
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
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ClockProvider>
          <SessionProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SessionProvider>
        </ClockProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  )
}
