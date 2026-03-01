import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MembershipPlansPage from './pages/MembershipPlansPage';
import MembershipsPage from './pages/MembershipsPage';
import MembershipFormPage from './pages/MembershipFormPage';
import './i18n/config';
import './styles/global.css';

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Завантаження...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/dashboard" /> : children;
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
