import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css';

const loginSchema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(1, 'Пароль обов\'язковий')
});

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || err.response?.data?.error || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <h1>{t('auth.loginTitle')}</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group login-form-group">
            <label className="login-label">{t('auth.email')}</label>
            <input
              type="email"
              {...register('email')}
              autoComplete="email"
              placeholder="name@example.com"
              className="login-input"
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>

          <div className="form-group login-form-group">
            <label className="login-label">{t('auth.password')}</label>
            <input
              type="password"
              {...register('password')}
              autoComplete="current-password"
              placeholder="••••••••"
              className="login-input"
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('common.loading') : t('auth.loginButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
