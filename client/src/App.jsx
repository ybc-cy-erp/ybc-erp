import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PageTitleProvider } from './context/PageTitleContext';
import { useContext } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembershipPlansPage from './pages/MembershipPlansPage';
import MembershipsPage from './pages/MembershipsPage';
import MembershipFormPage from './pages/MembershipFormPage';
import MembershipDetailsPage from './pages/MembershipDetailsPage';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import BillsPage from './pages/BillsPage';
import WalletsPage from './pages/WalletsPage';
import ReportsPage from './pages/ReportsPage';
import CounterpartiesPage from './pages/CounterpartiesPage';
import ItemsPage from './pages/ItemsPage';
import DocumentsPage from './pages/DocumentsPage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import CurrencyExchangePage from './pages/CurrencyExchangePage';
import TransfersPage from './pages/TransfersPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import './i18n/config';
import './styles/global.css';
import './styles/premium.css';

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
      <PageTitleProvider>
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

          <Route path="/events/create" element={
            <PrivateRoute>
              <EventFormPage />
            </PrivateRoute>
          } />

          <Route path="/events/:id/edit" element={
            <PrivateRoute>
              <EventFormPage />
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

          <Route path="/counterparties" element={
            <PrivateRoute>
              <CounterpartiesPage />
            </PrivateRoute>
          } />

          <Route path="/items" element={
            <PrivateRoute>
              <ItemsPage />
            </PrivateRoute>
          } />

          <Route path="/documents" element={
            <PrivateRoute>
              <DocumentsPage />
            </PrivateRoute>
          } />

          <Route path="/chart-of-accounts" element={
            <PrivateRoute>
              <ChartOfAccountsPage />
            </PrivateRoute>
          } />

          <Route path="/currency-exchange" element={
            <PrivateRoute>
              <CurrencyExchangePage />
            </PrivateRoute>
          } />

          <Route path="/transfers" element={
            <PrivateRoute>
              <TransfersPage />
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
      </PageTitleProvider>
    </AuthProvider>
  );
}

export default App;
