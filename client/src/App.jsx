import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PageTitleProvider } from './context/PageTitleContext';
import { useContext } from 'react';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import MembershipPlansPage from './pages/MembershipPlansPage';
import MembershipPlansFinderPage from './pages/MembershipPlansFinderPage';
import MembershipsPage from './pages/MembershipsPage';
import MembershipFormPage from './pages/MembershipFormPage';
import MembershipDetailsPage from './pages/MembershipDetailsPage';
import EventsPage from './pages/EventsPage';
import EventFormPage from './pages/EventFormPage';
import BillsPage from './pages/BillsPage';
import BillFormPage from './pages/BillFormPage';
import WalletsPage from './pages/WalletsPage';
import ReportsPage from './pages/ReportsPage';
import ProfitLossReportPage from './pages/reports/ProfitLossReportPage';
import BalanceSheetReportPage from './pages/reports/BalanceSheetReportPage';
import CashFlowReportPage from './pages/reports/CashFlowReportPage';
import CounterpartiesPage from './pages/CounterpartiesPage';
import ItemsPage from './pages/ItemsPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentsHubPage from './pages/DocumentsHubPage';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import CurrencyExchangePage from './pages/CurrencyExchangePage';
import TransfersPage from './pages/TransfersPage';
import DirectoriesPage from './pages/DirectoriesPage';
import DirectoriesTabsPage from './pages/DirectoriesTabsPage';
import FinancePage from './pages/FinancePage';
import AccountsPage from './pages/AccountsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import CashDocumentsPage from './pages/CashDocumentsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import './i18n/config';
import './styles/global.css';
import './styles/premium.css';
import './styles/modal.css';
import './styles/mobile.css';

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

          <Route path="/signup" element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          } />

          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
              <MembershipPlansFinderPage />
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

          <Route path="/bills/create" element={
            <PrivateRoute>
              <BillFormPage />
            </PrivateRoute>
          } />

          <Route path="/bills/:id/edit" element={
            <PrivateRoute>
              <BillFormPage />
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
              <DocumentsHubPage />
            </PrivateRoute>
          } />

          <Route path="/document-journal" element={
            <PrivateRoute>
              <DocumentsPage />
            </PrivateRoute>
          } />

          <Route path="/cash-documents" element={
            <PrivateRoute>
              <CashDocumentsPage />
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

          <Route path="/directories" element={
            <PrivateRoute>
              <DirectoriesTabsPage />
            </PrivateRoute>
          } />

          <Route path="/finance" element={
            <PrivateRoute>
              <FinancePage />
            </PrivateRoute>
          } />

          <Route path="/accounts" element={
            <PrivateRoute>
              <AccountsPage />
            </PrivateRoute>
          } />

          <Route path="/users" element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          } />

          <Route path="/reports" element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          } />

          <Route path="/reports/profit-loss" element={
            <PrivateRoute>
              <ProfitLossReportPage />
            </PrivateRoute>
          } />

          <Route path="/reports/balance-sheet" element={
            <PrivateRoute>
              <BalanceSheetReportPage />
            </PrivateRoute>
          } />

          <Route path="/reports/cash-flow" element={
            <PrivateRoute>
              <CashFlowReportPage />
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
