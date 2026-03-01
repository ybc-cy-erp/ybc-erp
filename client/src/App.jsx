import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembershipPlansPage from './pages/MembershipPlansPage';
import MembershipsPage from './pages/MembershipsPage';
import MembershipFormPage from './pages/MembershipFormPage';
import MembershipDetailsPage from './pages/MembershipDetailsPage';
import EventsPage from './pages/EventsPage';
import BillsPage from './pages/BillsPage';
import WalletsPage from './pages/WalletsPage';
import ReportsPage from './pages/ReportsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import './i18n/config';
import './styles/global.css';

function PrivateRoute({ children }) {
  const { user, loading, mustChangePassword } = useContext(AuthContext);

  if (loading) {
    return <div>Завантаження...</div>;
  }

  if (!user) return <Navigate to="/login" />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  return children;
}

function PasswordChangeRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Завантаження...</div>;
  }

  if (!user) return <Navigate to="/login" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, mustChangePassword } = useContext(AuthContext);
  if (user && mustChangePassword) return <Navigate to="/change-password" replace />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />

          <Route path="/change-password" element={
            <PasswordChangeRoute>
              <ChangePasswordPage />
            </PasswordChangeRoute>
          } />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          
          <Route path="/membership-plans" element={
            <PrivateRoute>
              <MembershipPlansPage />
            </PrivateRoute>
          } />
          
          <Route path="/memberships" element={
            <PrivateRoute>
              <MembershipsPage />
            </PrivateRoute>
          } />
          
          <Route path="/memberships/create" element={
            <PrivateRoute>
              <MembershipFormPage />
            </PrivateRoute>
          } />
          
          <Route path="/memberships/:id/edit" element={
            <PrivateRoute>
              <MembershipFormPage />
            </PrivateRoute>
          } />
          
          <Route path="/memberships/:id" element={
            <PrivateRoute>
              <MembershipDetailsPage />
            </PrivateRoute>
          } />
          
          <Route path="/events" element={
            <PrivateRoute>
              <EventsPage />
            </PrivateRoute>
          } />
          
          <Route path="/bills" element={
            <PrivateRoute>
              <BillsPage />
            </PrivateRoute>
          } />

          <Route path="/wallets" element={
            <PrivateRoute>
              <WalletsPage />
            </PrivateRoute>
          } />

          <Route path="/reports" element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
