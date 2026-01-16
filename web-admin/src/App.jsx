import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CondominiumsPage from './pages/units/CondominiumsPage';
import BlocksPage from './pages/units/BlocksPage';
import ApartmentsPage from './pages/units/ApartmentsPage';
import UsersPage from './pages/users/UsersPage';
import ResidentsPage from './pages/users/ResidentsPage';
import JanitorsPage from './pages/users/JanitorsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              
              {/* Units */}
              <Route path="/units/condominiums" element={<CondominiumsPage />} />
              <Route path="/units/blocks" element={<BlocksPage />} />
              <Route path="/units/apartments" element={<ApartmentsPage />} />
              
              {/* Users */}
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/residents" element={<ResidentsPage />} />
              <Route path="/users/janitors" element={<JanitorsPage />} />
              
              {/* Placeholder routes */}
              <Route path="/announcements" element={<ComingSoon title="Comunicados" />} />
              <Route path="/settings" element={<ComingSoon title="Configurações" />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Componente temporário para páginas em desenvolvimento
function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-slate-500">Esta funcionalidade estará disponível em breve.</p>
      </div>
    </div>
  );
}

export default App;
