import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { membershipService } from '../../services/membershipService';
import './FreezePanel.css';

const freezeSchema = z.object({
  start_date: z.string().min(1, 'Дата початку обов\'язкова'),
  end_date: z.string().min(1, 'Дата закінчення обов\'язкова'),
  reason: z.string().optional()
});

export default function FreezePanel({ membershipId, onUpdate }) {
  const [freezes, setFreezes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(freezeSchema)
  });

  useEffect(() => {
    loadFreezes();
  }, []);

  const loadFreezes = async () => {
    try {
      setLoading(true);
      const response = await membershipService.getFreezes(membershipId);
      setFreezes(response.data.freezes);
      setError(null);
    } catch (err) {
      console.error('Failed to load freezes:', err);
      setError('Не вдалося завантажити періоди заморозки');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await membershipService.createFreeze(membershipId, data);
      reset();
      setShowForm(false);
      loadFreezes();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка створення заморозки');
    }
  };

  const handleRemove = async (freezeId) => {
    if (!window.confirm('Видалити цей період заморозки?')) return;

    try {
      await membershipService.removeFreeze(membershipId, freezeId);
      loadFreezes();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка видалення');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="freeze-panel"><div className="loading">Завантаження...</div></div>;
  }

  return (
    <div className="freeze-panel">
      {error && <div className="error-message">{error}</div>}

      <div className="freeze-header">
        <h4>Періоди заморозки</h4>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Додати заморозку
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="freeze-form glass-card">
          <div className="form-row">
            <div className="form-group">
              <label>Дата початку *</label>
              <input type="date" {...register('start_date')} />
              {errors.start_date && <span className="error">{errors.start_date.message}</span>}
            </div>

            <div className="form-group">
              <label>Дата закінчення *</label>
              <input type="date" {...register('end_date')} />
              {errors.end_date && <span className="error">{errors.end_date.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Причина (необов'язково)</label>
            <textarea {...register('reason')} rows="2" placeholder="Причина заморозки..."></textarea>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Скасувати
            </button>
            <button type="submit" className="btn-primary">
              Додати
            </button>
          </div>
        </form>
      )}

      <div className="freeze-list">
        {freezes.map(freeze => (
          <div key={freeze.id} className="freeze-item glass-card">
            <div className="freeze-dates">
              <strong>{formatDate(freeze.start_date)} — {formatDate(freeze.end_date)}</strong>
              <span className="freeze-duration">
                ({calculateDays(freeze.start_date, freeze.end_date)} днів)
              </span>
            </div>
            {freeze.reason && (
              <div className="freeze-reason">{freeze.reason}</div>
            )}
            <button onClick={() => handleRemove(freeze.id)} className="btn-remove">
              Видалити
            </button>
          </div>
        ))}

        {freezes.length === 0 && !showForm && (
          <div className="empty-freezes">
            <p>Періоди заморозки відсутні</p>
          </div>
        )}
      </div>
    </div>
  );
}
