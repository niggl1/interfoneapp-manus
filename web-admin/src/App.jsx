import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CondominiumsPage from './pages/units/CondominiumsPage';
import BlocksPage from './pages/units/BlocksPage';
import ApartmentsPage from './pages/units/ApartmentsPage';
import UsersPage from './pages/users/UsersPage';
import ResidentsPage from './pages/users/ResidentsPage';
import JanitorsPage from './pages/users/JanitorsPage';
import CallHistoryPage from './pages/calls/CallHistoryPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import ArrivalNoticesPage from './pages/access/ArrivalNoticesPage';
import ChatPage from './pages/chat/ChatPage';
import InvitationsPage from './pages/invitations/InvitationsPage';

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
          <CallProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                
                {/* Calls */}
                <Route path="/calls" element={<CallHistoryPage />} />
                
                {/* Chat */}
                <Route path="/chat" element={<ChatPage />} />
                
                {/* Access Control */}
                <Route path="/access/arrivals" element={<ArrivalNoticesPage />} />
                
                {/* Invitations */}
                <Route path="/invitations" element={<InvitationsPage />} />
                
                {/* Announcements */}
                <Route path="/announcements" element={<AnnouncementsPage />} />
                
                {/* Settings */}
                <Route path="/settings" element={<ComingSoon title="Configurações" />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CallProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Componente temporário para páginas em desenvolvimento
function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-slate-500">Esta funcionalidade estará disponível em breve.</p>
      </div>
    </div>
  );
}

export default App;
