import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';

export default function ChangePasswordPage() {
  const { updatePassword, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Пароль має бути мінімум 8 символів');
    if (password !== confirm) return setError('Паролі не співпадають');

    try {
      setLoading(true);
      await updatePassword(password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Помилка зміни пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <h1>Зміна пароля</h1>
        <p style={{ marginBottom: 12, color: '#4b5563' }}>Це перший вхід. Потрібно замінити тимчасовий пароль.</p>
        {error && <div className="error-message">{error}</div>}
        <form className="login-form" onSubmit={onSubmit}>
          <div className="form-group login-form-group">
            <label className="login-label">Новий пароль</label>
            <div className="password-input-wrap">
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group login-form-group">
            <label className="login-label">Повторіть пароль</label>
            <div className="password-input-wrap">
              <input
                className="login-input"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Приховати пароль' : 'Показати пароль'}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Збереження...' : 'Змінити пароль'}</button>
          <button style={{marginTop:8}} className="btn-primary" type="button" onClick={logout}>Вийти</button>
        </form>
      </div>
    </div>
  );
}
