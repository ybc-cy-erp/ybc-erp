import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import eventService from '../services/eventService';
import counterpartyService from '../services/counterpartyService';
import DashboardLayout from '../components/layout/DashboardLayout';
import './EventForm.css';

// Zod validation schema
const eventSchema = z.object({
  counterparty_id: z.string().optional(),
  name: z.string().min(2, 'Назва події має містити мінімум 2 символи'),
  event_date: z.string().min(1, 'Вкажіть дату події'),
  location: z.string().optional(),
  description: z.string().optional(),
});

function EventFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
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
    resolver: zodResolver(eventSchema),
    defaultValues: {
      counterparty_id: '',
      name: '',
      event_date: new Date().toISOString().slice(0, 16),
      location: '',
      description: ''
    }
  });

  useEffect(() => {
    loadCounterparties();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      loadEvent();
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

  const loadEvent = async () => {
    try {
      setLoadingData(true);
      const data = await eventService.getById(id);
      
      reset({
        counterparty_id: data.counterparty_id || '',
        name: data.name || '',
        event_date: data.event_date?.slice(0, 16) || '',
        location: data.location || '',
        description: data.description || ''
      });

      setError(null);
    } catch (err) {
      console.error('Failed to load event:', err);
      setError('Помилка завантаження події');
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
        name: data.name,
        event_date: data.event_date,
        location: data.location || null,
        description: data.description || null
      };

      if (isEditMode) {
        await eventService.update(id, payload);
      } else {
        await eventService.create(payload);
      }

      navigate('/events');
    } catch (err) {
      console.error('Failed to save event:', err);
      setError(err.message || 'Помилка збереження події');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  if (loadingData) {
    return (
      <DashboardLayout>
      <div className="event-form-page">
        <div className="loading">Завантаження...</div>
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="event-form-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Редагувати подію' : 'Створити подію'}</h1>
      </div>

      {error && (
        <div className="error-banner">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="event-form glass-card">
        <div className="form-section">
          <h2>Основна інформація</h2>
          
          <div className="form-group">
            <label htmlFor="counterparty_id">
              Організатор/Спонсор (контрагент)
            </label>
            <select
              id="counterparty_id"
              {...register('counterparty_id')}
              className={errors.counterparty_id ? 'error' : ''}
              disabled={loading}
            >
              <option value="">Не вибрано</option>
              {counterparties.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.name}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Опціонально — виберіть контрагента, якщо подія організована партнером
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="name">
              Назва події <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Назва події"
              className={errors.name ? 'error' : ''}
              disabled={loading}
            />
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event_date">
                Дата та час <span className="required">*</span>
              </label>
              <input
                id="event_date"
                type="datetime-local"
                {...register('event_date')}
                className={errors.event_date ? 'error' : ''}
                disabled={loading}
              />
              {errors.event_date && (
                <span className="error-message">{errors.event_date.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="location">
                Локація
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                placeholder="Адреса або назва місця"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Опис</label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Опис події..."
              rows={4}
              className={errors.description ? 'error' : ''}
              disabled={loading}
            />
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
            {loading ? 'Збереження...' : (isEditMode ? 'Зберегти зміни' : 'Створити подію')}
          </button>
        </div>
      </form>
    </div>
    </DashboardLayout>
  );
}

export default EventFormPage;
