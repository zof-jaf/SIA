import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { resolveRoleHome, roleHome, type Role } from './services/auth'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import ProfessorDashboard from './pages/ProfessorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import TramitesPage from './pages/TramitesPage'

/**
 * Pantalla mostrada mientras se restaura la sesión desde la cookie httpOnly.
 */
function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500 dark:bg-[#121417] dark:text-slate-400">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-extrabold text-white shadow-lg shadow-brand/25">
        U
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
      <p className="text-sm">Verificando sesión...</p>
    </div>
  )
}

/**
 * Guard de ruta que exige sesión activa y uno de los roles permitidos.
 * Si el rol no coincide, redirige al panel propio en lugar de mostrar el ajeno.
 * @param props Roles autorizados y contenido protegido.
 */
function ProtectedRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />

  const home = resolveRoleHome(user.rol)
  if (!home) return <Navigate to="/login" replace />
  if (!roles.includes(user.rol)) return <Navigate to={home} replace />

  return <>{children}</>
}

/**
 * Guard para rutas públicas que evita que un usuario autenticado vuelva al login.
 * @param props Contenido público.
 */
function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to={roleHome[user.rol]} replace />

  return <>{children}</>
}

/**
 * Redirección inicial según la sesión y el rol del usuario.
 */
function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  return <Navigate to={user ? roleHome[user.rol] : '/login'} replace />
}

/**
 * Configuración de rutas por rol y providers globales de tema y autenticación.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <Login />
                </PublicOnly>
              }
            />
            <Route
              path="/estudiante"
              element={
                <ProtectedRoute roles={['ESTUDIANTE']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profesor"
              element={
                <ProtectedRoute roles={['PROFESOR']}>
                  <ProfessorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMINISTRADOR']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tramites"
              element={
                <ProtectedRoute roles={['ESTUDIANTE', 'ADMINISTRADOR']}>
                  <TramitesPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
