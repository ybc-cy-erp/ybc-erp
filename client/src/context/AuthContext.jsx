import { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const AuthContext = createContext();

const mapUser = (sbUser, token) => ({
  id: sbUser.id,
  email: sbUser.email,
  name: sbUser.user_metadata?.name || sbUser.email,
  role: sbUser.user_metadata?.role || 'Owner',
  tenant_id: sbUser.user_metadata?.tenant_id || null,
  force_password_change: !!sbUser.user_metadata?.force_password_change,
  token,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const qaBypass = import.meta.env.VITE_QA_BYPASS_AUTH === 'true';

  useEffect(() => {
    if (qaBypass) {
      const mockUser = {
        id: 'qa-user',
        email: 'qa@ybc.local',
        name: 'QA User',
        role: 'Owner',
        tenant_id: import.meta.env.VITE_PUBLIC_TENANT_ID || 'e5a61f2f-5a98-4ff3-bd16-a53a6720dd00',
        force_password_change: false,
        token: 'qa-token',
      };
      setUser(mockUser);
      localStorage.setItem('jwt', mockUser.token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        const mapped = mapUser(session.user, session.access_token);
        setUser(mapped);
        localStorage.setItem('jwt', session.access_token || '');
        localStorage.setItem('user', JSON.stringify(mapped));
      } else {
        setUser(null);
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const mapped = mapUser(session.user, session.access_token);
        setUser(mapped);
        localStorage.setItem('jwt', session.access_token || '');
        localStorage.setItem('user', JSON.stringify(mapped));
      } else {
        setUser(null);
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [qaBypass]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return mapUser(data.user, data.session?.access_token);
  };

  const register = async (tenantName, email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          tenant_name: tenantName,
          role: 'Owner',
        }
      }
    });
    if (error) throw error;
    return mapUser(data.user, data.session?.access_token);
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { force_password_change: false }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    register,
    updatePassword,
    logout,
    isAuthenticated: !!user,
    mustChangePassword: !!user?.force_password_change,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
