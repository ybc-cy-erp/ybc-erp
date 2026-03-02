import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import billService from '../services/billService';
import counterpartyService from '../services/counterpartyService';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';

const billSchema = z.object({
  counterparty_id: z.string().optional(),
  vendor_name: z.string().optional(),
  bill_number: z.string().min(1, 'Вкажіть номер рахунку'),
  bill_date: z.string().min(1, 'Вкажіть дату рахунку'),
  due_date: z.string().optional(),
  amount: z.number().positive('Сума має бути більше 0'),
  currency: z.string().default('EUR'),
  description: z.string().optional(),
}).refine(data => data.counterparty_id || data.vendor_name, {
  message: 'Виберіть контрагента або введіть назву постачальника',
  path: ['counterparty_id']
});

function BillFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { setPageTitle } = usePageTitle();
  const isEditMode = Boolean(id);

  const [counterparties, setCounterparties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(billSchema),
    defaultValues: {
      counterparty_id: '',
      vendor_name: '',
      bill_number: '',
      bill_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      amount: 0,
      currency: 'EUR',
      description: ''
    }
  });

  useEffect(() => {
    setPageTitle(isEditMode ? 'Редагувати рахунок' : 'Створити рахунок');
    loadCounterparties();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      loadBill();
    }
  }, [id]);

  const loadCounterparties = async () => {
    try {
      const data = await counterpartyService.getAll();
      setCounterparties(data || []);
    } catch (err) {
      console.error('Failed to load counterparties:', err);
    }
  };

  const loadBill = async () => {
    try {
      setLoadingData(true);
      const data = await billService.getById(id);
      
      reset({
        counterparty_id: data.counterparty_id || '',
        vendor_name: data.vendor || '',
        bill_number: data.bill_number || '',
        bill_date: data.bill_date?.slice(0, 10) || '',
        due_date: data.due_date?.slice(0, 10) || '',
        amount: data.amount || 0,
        currency: data.currency || 'EUR',
        description: data.description || ''
      });

      setError(null);
    } catch (err) {
      console.error('Failed to load bill:', err);
      setError('Помилка завантаження рахунку');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        counterparty_id: data.counterparty_id || null,
        vendor: data.vendor_name || null,
        bill_number: data.bill_number,
        bill_date: data.bill_date,
        due_date: data.due_date || null,
        amount: data.amount,
        currency: data.currency,
        description: data.description || null
      };

      if (isEditMode) {
        await billService.update(id, payload);
      } else {
        await billService.create(payload);
      }

      navigate('/bills');
    } catch (err) {
      console.error('Failed to save bill:', err);
      setError(err.message || 'Помилка збереження рахунку');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/bills');
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="loading">Завантаження...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {error && (
          <div className="error-message">❌ {error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card">
          <div className="form-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Постачальник</h2>
            
            <div className="form-group">
              <label>Контрагент</label>
              <select {...register('counterparty_id')}>
                <option value="">Не вибрано (ввести вручну)</option>
                {counterparties.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name}
                  </option>
                ))}
              </select>
              {errors.counterparty_id && (
                <span className="error">{errors.counterparty_id.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Або введіть назву постачальника</label>
              <input
                type="text"
                {...register('vendor_name')}
                placeholder="Назва постачальника"
              />
            </div>
          </div>

          <div className="form-section" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Деталі рахунку</h2>

            <div className="form-group">
              <label>№ Рахунку <span style={{color: 'var(--text-secondary)'}}>*</span></label>
              <input
                type="text"
                {...register('bill_number')}
                placeholder="INV-2026-001"
              />
              {errors.bill_number && (
                <span className="error">{errors.bill_number.message}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Дата рахунку <span style={{color: 'var(--text-secondary)'}}>*</span></label>
                <input
                  type="date"
                  {...register('bill_date')}
                />
                {errors.bill_date && (
                  <span className="error">{errors.bill_date.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>Термін оплати</label>
                <input
                  type="date"
                  {...register('due_date')}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Сума <span style={{color: 'var(--text-secondary)'}}>*</span></label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <span className="error">{errors.amount.message}</span>
                )}
              </div>

              <div className="form-group">
                <label>Валюта</label>
                <select {...register('currency')}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Опис</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Опис послуг або товарів..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
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
              {loading ? 'Збереження...' : (isEditMode ? 'Зберегти' : 'Створити')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default BillFormPage;
