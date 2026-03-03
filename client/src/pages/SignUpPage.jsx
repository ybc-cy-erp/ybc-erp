import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (form.password.length < 8) {
      setError('Пароль має містити мінімум 8 символів');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (!form.name || form.name.length < 2) {
      setError('Введіть ваше ім\'я (мінімум 2 символи)');
      return;
    }

    try {
      setLoading(true);

      // Public signup should not depend on reading protected tables (RLS blocks anon in Firefox/Chrome alike)
      // Single-tenant mode: use configured tenant id with safe fallback
      const tenantId =
        import.meta.env.VITE_PUBLIC_TENANT_ID ||
        'e5a61f2f-5a98-4ff3-bd16-a53a6720dd00';

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            tenant_id: tenantId,
            role: 'Staff',
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create user record with inactive status (needs admin approval)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          tenant_id: tenantId,
          email: form.email,
          name: form.name,
          role: 'Staff',
          status: 'inactive', // Needs admin approval
        });

      if (userError) {
        console.error('Failed to create user record:', userError);
        // Don't fail the whole process if user record creation fails
      }

      // Show success message
      setError('');
      alert(
        '✅ Реєстрація успішна!\n\n' +
        'Ваш обліковий запис очікує на підтвердження адміністратором.\n' +
        'Ви отримаєте доступ після активації.\n\n' +
        'Email: ' + form.email
      );

      // Redirect to login
      navigate('/login');
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('Користувач з таким email вже існує');
      } else {
        setError(err.message || 'Помилка реєстрації');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <h1>Реєстрація</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Створіть обліковий запис. Після реєстрації адміністратор активує ваш доступ.
        </p>

        {error && (
          <div className="error-message" style={{
            background: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#ff3b30'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label className="login-label">Ім'я та прізвище</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="login-input"
              placeholder="Іван Іванов"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="login-form-group">
            <label className="login-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="login-input"
              placeholder="ivan@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="login-form-group">
            <label className="login-label">Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="login-input"
              placeholder="Мінімум 8 символів"
              required
              disabled={loading}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Мінімум 8 символів. Використовуйте букви, цифри та спецсимволи.
            </p>
          </div>

          <div className="login-form-group">
            <label className="login-label">Підтвердіть пароль</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="login-input"
              placeholder="Введіть пароль ще раз"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '24px' }}
            disabled={loading}
          >
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Вже маєте обліковий запис? </span>
          <a
            href="/login"
            style={{
              color: 'var(--text-primary)',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            Увійти
          </a>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
