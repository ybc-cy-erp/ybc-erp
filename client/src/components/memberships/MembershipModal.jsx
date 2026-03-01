import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import membershipService from '../../services/membershipService';
import membershipPlanService from '../../services/membershipPlanService';
import FreezePanel from './FreezePanel';
import './PlanModal.css';

const membershipSchema = z.object({
  plan_id: z.string().uuid('Оберіть тарифний план'),
  client_name: z.string().min(2, 'Ім\'я клієнта має містити мінімум 2 символи').optional(),
  start_date: z.string().min(1, 'Дата початку обов\'язкова'),
  payment_amount: z.number().positive('Сума має бути більше 0'),
  payment_currency: z.enum(['EUR', 'USD', 'USDT', 'BTC', 'ETH']).default('EUR'),
  status: z.enum(['active', 'frozen', 'cancelled', 'expired']).optional()
});

export default function MembershipModal({ membership, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details | freeze
  const isEditing = !!membership;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(membershipSchema),
    defaultValues: membership || {
      plan_id: '',
      client_name: '',
      start_date: new Date().toISOString().split('T')[0],
      payment_amount: 100,
      payment_currency: 'EUR'
    }
  });

  useEffect(() => {
    loadPlans();
    if (isEditing) {
      loadRevenue();
    }
  }, []);

  const loadPlans = async () => {
    try {
      const response = await membershipPlanService.getAll('active');
      setPlans(response.data.plans);
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  const loadRevenue = async () => {
    try {
      const response = await membershipService.getRevenue(membership.id);
      setRevenue(response.data);
    } catch (err) {
      console.error('Failed to load revenue:', err);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditing) {
        await membershipService.update(membership.id, data);
      } else {
        await membershipService.create(data);
      }

      onClose(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Скасувати це членство?')) return;
    
    try {
      await membershipService.cancel(membership.id);
      onClose(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка скасування');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content glass-card large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Редагувати членство' : 'Створити членство'}</h2>
          <button onClick={() => onClose(false)} className="modal-close">×</button>
        </div>

        {isEditing && (
          <div className="modal-tabs">
            <button
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Деталі
            </button>
            <button
              className={`tab ${activeTab === 'freeze' ? 'active' : ''}`}
              onClick={() => setActiveTab('freeze')}
            >
              Заморозка
            </button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'details' && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label>Тарифний план *</label>
              <select {...register('plan_id')} disabled={isEditing}>
                <option value="">Оберіть план</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.daily_rate} EUR/день)
                  </option>
                ))}
              </select>
              {errors.plan_id && <span className="error">{errors.plan_id.message}</span>}
            </div>

            <div className="form-group">
              <label>Ім'я клієнта *</label>
              <input type="text" {...register('client_name')} />
              {errors.client_name && <span className="error">{errors.client_name.message}</span>}
            </div>

            <div className="form-group">
              <label>Дата початку *</label>
              <input type="date" {...register('start_date')} disabled={isEditing} />
              {errors.start_date && <span className="error">{errors.start_date.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Сума оплати *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('payment_amount', { valueAsNumber: true })}
                />
                {errors.payment_amount && <span className="error">{errors.payment_amount.message}</span>}
              </div>

              <div className="form-group">
                <label>Валюта *</label>
                <select {...register('payment_currency')}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="form-group">
                <label>Статус</label>
                <select {...register('status')}>
                  <option value="active">Активне</option>
                  <option value="frozen">Заморожене</option>
                  <option value="cancelled">Скасоване</option>
                  <option value="expired">Закінчилося</option>
                </select>
              </div>
            )}

            {isEditing && revenue && (
              <div className="revenue-info glass-card">
                <h4>Розрахунок доходу</h4>
                <div className="revenue-row">
                  <span>Активних днів:</span>
                  <strong>{revenue.active_days}</strong>
                </div>
                <div className="revenue-row">
                  <span>Заморожених днів:</span>
                  <strong>{revenue.frozen_days}</strong>
                </div>
                <div className="revenue-row">
                  <span>Денна ставка:</span>
                  <strong>{revenue.daily_rate} {revenue.currency}</strong>
                </div>
                <div className="revenue-row total">
                  <span>Загальний дохід:</span>
                  <strong>{revenue.total_revenue} {revenue.currency}</strong>
                </div>
              </div>
            )}

            <div className="modal-actions">
              {isEditing && membership.status !== 'cancelled' && (
                <button type="button" onClick={handleCancel} className="btn-delete">
                  Скасувати членство
                </button>
              )}
              <button type="button" onClick={() => onClose(false)} className="btn-secondary">
                Закрити
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'freeze' && isEditing && (
          <FreezePanel membershipId={membership.id} onUpdate={loadRevenue} />
        )}
      </div>
    </div>
  );
}
