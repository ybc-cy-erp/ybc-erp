import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import membershipService from '../services/membershipService';
import membershipPlanService from '../services/membershipPlanService';
import DashboardLayout from '../components/layout/DashboardLayout';
import './MembershipForm.css';

// Zod validation schema
const membershipSchema = z.object({
  customer_name: z.string()
    .min(2, 'Ім\'я клієнта має містити мінімум 2 символи')
    .max(100, 'Ім\'я клієнта не може перевищувати 100 символів'),
  plan_id: z.string().uuid('Виберіть тарифний план'),
  start_date: z.string().min(1, 'Вкажіть дату початку'),
  amount: z.number()
    .min(0, 'Сума не може бути від\'ємною')
    .optional(),
  notes: z.string().max(500, 'Примітки не можуть перевищувати 500 символів').optional()
});

function MembershipFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      customer_name: '',
      plan_id: '',
      start_date: new Date().toISOString().split('T')[0],
      amount: 0,
      notes: ''
    }
  });

  const planId = watch('plan_id');
  const startDate = watch('start_date');

  // Load plans
  useEffect(() => {
    loadPlans();
  }, []);

  // Load membership data if editing
  useEffect(() => {
    if (isEditMode) {
      loadMembership();
    }
  }, [id]);

  // Auto-calculate amount when plan or start date changes
  useEffect(() => {
    if (planId && startDate && !isEditMode) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        calculateAmount(plan, startDate);
      }
    }
  }, [planId, startDate, plans]);

  const loadPlans = async () => {
    try {
      const data = await membershipPlanService.getAll();
      // Only show active plans
      const activePlans = data.filter(p => p.status === 'active');
      setPlans(activePlans);
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError('Помилка завантаження тарифних планів');
    }
  };

  const loadMembership = async () => {
    try {
      setLoadingData(true);
      const data = await membershipService.getById(id);
      
      // Populate form with existing data
      reset({
        customer_name: data.customer_name || '',
        plan_id: data.plan_id || '',
        start_date: data.start_date?.split('T')[0] || '',
        amount: data.amount || 0,
        notes: data.notes || ''
      });

      // Set selected plan
      const plan = plans.find(p => p.id === data.plan_id);
      if (plan) {
        setSelectedPlan(plan);
      }
    } catch (err) {
      console.error('Failed to load membership:', err);
      setError('Помилка завантаження членства');
    } finally {
      setLoadingData(false);
    }
  };

  const calculateAmount = (plan, startDateStr) => {
    if (!plan || !startDateStr) return;

    const startDate = new Date(startDateStr);
    let endDate;

    if (plan.type === 'lifetime') {
      // Lifetime memberships - use a large fixed amount or user-defined
      setValue('amount', plan.daily_rate * 3650); // 10 years worth as default
      return;
    }

    if (plan.duration_days) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration_days);
      const totalAmount = plan.daily_rate * plan.duration_days;
      setValue('amount', parseFloat(totalAmount.toFixed(2)));
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare payload
      const payload = {
        customer_name: data.customer_name,
        plan_id: data.plan_id,
        start_date: data.start_date,
        amount: data.amount || 0,
        notes: data.notes || null
      };

      if (isEditMode) {
        await membershipService.update(id, payload);
      } else {
        await membershipService.create(payload);
      }

      // Navigate back to memberships list
      navigate('/memberships');
    } catch (err) {
      console.error('Failed to save membership:', err);
      setError(err.message || 'Помилка збереження членства');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/memberships');
  };

  if (loadingData) {
    return (
      <DashboardLayout>
      <div className="membership-form-page">
        <div className="loading">Завантаження...</div>
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="membership-form-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Редагувати членство' : 'Створити членство'}</h1>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="membership-form glass-card">
        <div className="form-section">
          <h2>Інформація про клієнта</h2>
          
          <div className="form-group">
            <label htmlFor="customer_name">
              Ім'я клієнта <span className="required">*</span>
            </label>
            <input
              id="customer_name"
              type="text"
              {...register('customer_name')}
              placeholder="Введіть ім'я клієнта"
              className={errors.customer_name ? 'error' : ''}
              disabled={loading}
            />
            {errors.customer_name && (
              <span className="error-message">{errors.customer_name.message}</span>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Деталі членства</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plan_id">
                Тарифний план <span className="required">*</span>
              </label>
              <select
                id="plan_id"
                {...register('plan_id')}
                className={errors.plan_id ? 'error' : ''}
                disabled={loading || isEditMode} // Disable plan change in edit mode
              >
                <option value="">Виберіть план</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — €{plan.daily_rate}/день
                    {plan.type === 'lifetime' && ' (Безстроковий)'}
                  </option>
                ))}
              </select>
              {errors.plan_id && (
                <span className="error-message">{errors.plan_id.message}</span>
              )}
              {isEditMode && (
                <span className="field-hint">Тарифний план не можна змінити після створення</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="start_date">
                Дата початку <span className="required">*</span>
              </label>
              <input
                id="start_date"
                type="date"
                {...register('start_date')}
                className={errors.start_date ? 'error' : ''}
                disabled={loading}
              />
              {errors.start_date && (
                <span className="error-message">{errors.start_date.message}</span>
              )}
            </div>
          </div>

          {selectedPlan && (
            <div className="plan-info">
              <p><strong>Тип плану:</strong> {selectedPlan.type}</p>
              <p><strong>Тривалість:</strong> {
                selectedPlan.type === 'lifetime' 
                  ? 'Безстроковий' 
                  : `${selectedPlan.duration_days} днів`
              }</p>
              <p><strong>Денна ставка:</strong> €{selectedPlan.daily_rate}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">
              Сума (EUR) <span className="required">*</span>
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
              className={errors.amount ? 'error' : ''}
              disabled={loading}
            />
            {errors.amount && (
              <span className="error-message">{errors.amount.message}</span>
            )}
            <span className="field-hint">
              Сума розраховується автоматично на основі обраного плану
            </span>
          </div>
        </div>

        <div className="form-section">
          <h2>Додаткова інформація</h2>

          <div className="form-group">
            <label htmlFor="notes">Примітки</label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Додаткова інформація про членство..."
              rows={4}
              className={errors.notes ? 'error' : ''}
              disabled={loading}
            />
            {errors.notes && (
              <span className="error-message">{errors.notes.message}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Збереження...' : (isEditMode ? 'Зберегти зміни' : 'Створити членство')}
          </button>
        </div>
      </form>
    </div>
    </DashboardLayout>
  );
}

export default MembershipFormPage;
