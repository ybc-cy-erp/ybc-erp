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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Пароль должен быть минимум 8 символов');
    if (password !== confirm) return setError('Пароли не совпадают');

    try {
      setLoading(true);
      await updatePassword(password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <h1>Смена пароля</h1>
        <p style={{ marginBottom: 12, color: '#4b5563' }}>Это первый вход. Нужно заменить временный пароль.</p>
        {error && <div className="error-message">{error}</div>}
        <form className="login-form" onSubmit={onSubmit}>
          <div className="form-group login-form-group">
            <label className="login-label">Новый пароль</label>
            <input className="login-input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div className="form-group login-form-group">
            <label className="login-label">Повторите пароль</label>
            <input className="login-input" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сменить пароль'}</button>
          <button style={{marginTop:8}} className="btn-primary" type="button" onClick={logout}>Выйти</button>
        </form>
      </div>
    </div>
  );
}
