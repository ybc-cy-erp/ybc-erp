import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from magic link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Посилання недійсне або застаріле. Зверніться до адміністратора.');
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (password.length < 8) {
      setError('Пароль має містити мінімум 8 символів');
      return;
    }

    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    try {
      setLoading(true);

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Помилка встановлення пароля');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card glass-card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅ Успіх!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Пароль успішно встановлено
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Перенаправлення на сторінку входу...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <h1>Встановити пароль</h1>
        
        {error && (
          <div className="error-message" style={{ 
            background: 'rgba(255, 59, 48, 0.1)', 
            border: '1px solid rgba(255, 59, 48, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '1rem',
            color: '#ff3b30'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label className="login-label">Новий пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="Мінімум 8 символів"
              required
              disabled={loading}
              autoFocus
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Мінімум 8 символів. Рекомендуємо використовувати букви, цифри та спецсимволи.
            </p>
          </div>

          <div className="login-form-group">
            <label className="login-label">Підтвердіть пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="login-input"
              placeholder="Введіть пароль ще раз"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '1.5rem' }}
            disabled={loading}
          >
            {loading ? 'Збереження...' : 'Встановити пароль'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a 
            href="/login" 
            style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)', 
              textDecoration: 'none' 
            }}
          >
            ← Повернутись до входу
          </a>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
