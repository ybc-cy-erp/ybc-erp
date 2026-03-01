import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import membershipPlanService from '../../services/membershipPlanService';
import './PlanModal.css';

const planSchema = z.object({
  name: z.string().min(3, 'Назва має містити мінімум 3 символи'),
  type: z.enum(['monthly', 'quarterly', 'annual', 'lifetime', 'custom']),
  duration_days: z.number().int().min(1).nullable(),
  daily_rate: z.number().positive('Ставка має бути більше 0'),
  status: z.enum(['active', 'inactive']).default('active')
}).refine(data => {
  if (data.type === 'lifetime') return data.duration_days === null;
  return data.duration_days > 0;
}, {
  message: 'Довічні плани не повинні мати тривалості',
  path: ['duration_days']
});

export default function PlanModal({ plan, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditing = !!plan;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: plan || {
      name: '',
      type: 'monthly',
      duration_days: 30,
      daily_rate: 10,
      status: 'active'
    }
  });

  const watchType = watch('type');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      // Set duration_days to null for lifetime plans
      if (data.type === 'lifetime') {
        data.duration_days = null;
      }

      if (isEditing) {
        await membershipPlanService.update(plan.id, data);
      } else {
        await membershipPlanService.create(data);
      }

      onClose(true); // true = saved
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Редагувати план' : 'Створити план'}</h2>
          <button onClick={() => onClose(false)} className="modal-close">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Назва плану *</label>
            <input type="text" {...register('name')} />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Тип плану *</label>
            <select {...register('type')}>
              <option value="monthly">Місячний</option>
              <option value="quarterly">Квартальний</option>
              <option value="annual">Річний</option>
              <option value="lifetime">Довічний</option>
              <option value="custom">Індивідуальний</option>
            </select>
            {errors.type && <span className="error">{errors.type.message}</span>}
          </div>

          {watchType !== 'lifetime' && (
            <div className="form-group">
              <label>Тривалість (днів) *</label>
              <input
                type="number"
                {...register('duration_days', { valueAsNumber: true })}
                min="1"
              />
              {errors.duration_days && <span className="error">{errors.duration_days.message}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Денна ставка (EUR) *</label>
            <input
              type="number"
              step="0.01"
              {...register('daily_rate', { valueAsNumber: true })}
              min="0.01"
            />
            {errors.daily_rate && <span className="error">{errors.daily_rate.message}</span>}
          </div>

          <div className="form-group">
            <label>Статус</label>
            <select {...register('status')}>
              <option value="active">Активний</option>
              <option value="inactive">Неактивний</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary">
              Скасувати
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
