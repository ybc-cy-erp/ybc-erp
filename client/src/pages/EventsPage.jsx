import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
import DashboardLayout from '../components/layout/DashboardLayout';
import { usePageTitle } from '../context/PageTitleContext';
import './Events.css';

function EventsPage() {
  const navigate = useNavigate();
  const { setPageTitle } = usePageTitle();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setPageTitle('Події');
    loadEvents();
  }, [statusFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await eventService.getAll(params);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await eventService.publish(id);
      await loadEvents();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Скасувати цю подію?')) return;
    
    try {
      await eventService.cancel(id);
      await loadEvents();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Чернетка', className: 'status-draft' },
      published: { label: 'Опубліковано', className: 'status-published' },
      cancelled: { label: 'Скасовано', className: 'status-cancelled' }
    };
    const { label, className } = config[status] || {};
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  if (loading) {
    return <DashboardLayout><div className="events-page"><div className="loading">Завантаження...</div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
    <div className="events-page">
      <div className="page-header">
        
        <button onClick={() => navigate('/events/create')} className="btn-create">
          + Створити подію
        </button>
      </div>

      <div className="filters-panel glass-card">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Всі статуси</option>
          <option value="draft">Чернетки</option>
          <option value="published">Опубліковано</option>
          <option value="cancelled">Скасовано</option>
        </select>
      </div>

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-card glass-card">
            <div className="event-header">
              <h3>{event.name}</h3>
              {getStatusBadge(event.status)}
            </div>
            {event.counterparty_name && (
              <p className="event-organizer"> {event.counterparty_name}</p>
            )}
            <p className="event-date"> {formatDate(event.event_date)}</p>
            {event.location && <p className="event-location">📍 {event.location}</p>}
            {event.capacity && <p className="event-capacity"> Місткість: {event.capacity}</p>}
            <div className="event-actions">
              {event.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/events/${event.id}/edit`)} className="btn-edit">
                    Редагувати
                  </button>
                  <button onClick={() => handlePublish(event.id)} className="btn-publish">
                    Опублікувати
                  </button>
                </>
              )}
              {event.status !== 'cancelled' && (
                <button onClick={() => handleCancel(event.id)} className="btn-cancel">
                  Скасувати
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="empty-state glass-card">
          <p> Подій не знайдено</p>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}

export default EventsPage;
