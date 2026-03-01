import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import './FreezeModal.css';

// Zod validation schema
const freezeSchema = z.object({
  start_date: z.string().min(1, 'Вкажіть дату початку заморозки'),
  end_date: z.string().min(1, 'Вкажіть дату закінчення заморозки')
}).refine(data => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: 'Дата закінчення має бути пізніше дати початку',
  path: ['end_date']
});

function FreezeModal({ onSave, onClose }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(freezeSchema),
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    }
  });

  const onSubmit = async (data) => {
    await onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content freeze-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Додати заморозку</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="start_date">
                Дата початку <span className="required">*</span>
              </label>
              <input
                id="start_date"
                type="date"
                {...register('start_date')}
                className={errors.start_date ? 'error' : ''}
              />
              {errors.start_date && (
                <span className="error-message">{errors.start_date.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="end_date">
                Дата закінчення <span className="required">*</span>
              </label>
              <input
                id="end_date"
                type="date"
                {...register('end_date')}
                className={errors.end_date ? 'error' : ''}
              />
              {errors.end_date && (
                <span className="error-message">{errors.end_date.message}</span>
              )}
            </div>

            <div className="info-box">
              <p><strong>ℹ️ Зверніть увагу:</strong></p>
              <ul>
                <li>Членство автоматично продовжиться на період заморозки</li>
                <li>Розрахунок доходу призупиниться на період заморозки</li>
                <li>Заморозки не можна змінювати після створення</li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Збереження...' : 'Додати заморозку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FreezeModal;
