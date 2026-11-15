import { Suspense, lazy } from 'react'
import { createQueryClient } from './queryClient.js'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AccessibilityProvider } from '../context/AccessibilityContext.jsx'
import { ClockProvider } from '../context/ClockContext.jsx'
import { SessionProvider } from '../context/SessionContext.jsx'
import { AppShell } from '../components/layout/AppShell.jsx'
import { RouteFallback } from '../components/layout/RouteFallback.jsx'
import { PhoneFrame } from '../components/layout/PhoneFrame.jsx'
import { ErrorBoundary } from '../components/ui/ErrorBoundary.jsx'
import { ErrorState } from '../components/ui/States.jsx'
import { ToastProvider } from '../components/ui/Toast.jsx'
import { PostDetailPage } from '../features/community/PostDetailPage.jsx'
import { CommunityFeedPage } from '../features/community/CommunityFeedPage.jsx'
import { StateFeedPage } from '../features/state/StateFeedPage.jsx'
import {
  AdminGuestOnly,
  GuestOnly,
  RequireAdmin,
  RequireResident,
} from './RouteGuards.jsx'

// Telas menos usadas saem do pacote inicial e são baixadas na primeira visita.
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })))
const AdminHomePage = page(
  () => import('../features/admin/AdminHomePage.jsx'),
  'AdminHomePage',
)
const AdminLayout = page(() => import('../features/admin/AdminLayout.jsx'), 'AdminLayout')
const AdminLoginPage = page(
  () => import('../features/admin/AdminLoginPage.jsx'),
  'AdminLoginPage',
)
const NoticesPage = page(() => import('../features/admin/NoticesPage.jsx'), 'NoticesPage')
const ReportDetailPage = page(
  () => import('../features/admin/ReportDetailPage.jsx'),
  'ReportDetailPage',
)
const ReportsQueuePage = page(
  () => import('../features/admin/ReportsQueuePage.jsx'),
  'ReportsQueuePage',
)
const AdminSettingsPage = page(
  () => import('../features/admin/AdminSettingsPage.jsx'),
  'AdminSettingsPage',
)
const LoginPage = page(() => import('../features/auth/LoginPage.jsx'), 'LoginPage')
const SignupPage = page(() => import('../features/auth/SignupPage.jsx'), 'SignupPage')
const DesignSystemPage = page(
  () => import('../features/dev/DesignSystemPage.jsx'),
  'DesignSystemPage',
)
const CommercialFormPage = page(
  () => import('../features/community/CommercialFormPage.jsx'),
  'CommercialFormPage',
)
const ReportFormPage = page(
  () => import('../features/community/ReportFormPage.jsx'),
  'ReportFormPage',
)
const MapPage = page(() => import('../features/map/MapPage.jsx'), 'MapPage')
const AccessibilityPage = page(
  () => import('../features/profile/AccessibilityPage.jsx'),
  'AccessibilityPage',
)
const FollowedPlacesPage = page(
  () => import('../features/profile/FollowedPlacesPage.jsx'),
  'FollowedPlacesPage',
)
const ProfilePage = page(
  () => import('../features/profile/ProfilePage.jsx'),
  'ProfilePage',
)
const SettingsPage = page(
  () => import('../features/profile/SettingsPage.jsx'),
  'SettingsPage',
)
const StateDetailPage = page(
  () => import('../features/state/StateDetailPage.jsx'),
  'StateDetailPage',
)

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
    <Suspense fallback={<RouteFallback />}>
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
            <Route path="ocorrencias" element={<ReportsQueuePage />} />
            <Route path="ocorrencias/:id" element={<ReportDetailPage />} />
            <Route path="avisos" element={<NoticesPage />} />
            <Route path="parametros" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route element={<PhoneLayout />}>
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="inicio" element={<CommunityFeedPage />} />
          <Route path="publicacao/:id" element={<PostDetailPage />} />
          <Route path="estado" element={<StateFeedPage />} />
          <Route path="estado/:id" element={<StateDetailPage />} />
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
    </Suspense>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ClockProvider>
          <SessionProvider>
            <ErrorBoundary>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </ErrorBoundary>
          </SessionProvider>
        </ClockProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  )
}
