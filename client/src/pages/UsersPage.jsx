import React, { useState, useEffect } from 'react';
import { usePageTitle } from '../context/PageTitleContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import userService from '../services/userService';

function UsersPage({ embedded = false }) {
  const { setPageTitle } = usePageTitle();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'Staff' });

  useEffect(() => {
    if (!embedded) {
      setPageTitle('Користувачі');
    }
    loadUsers();
  }, [setPageTitle, embedded]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.update(userId, { role: newRole });
      loadUsers();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userService.update(userId, { status: newStatus });
      loadUsers();
    } catch (err) {
      alert(`Помилка: ${err.message}`);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const result = await userService.invite(inviteForm.email, inviteForm.name, inviteForm.role);
      const emailSent = result.data.emailSent;
      
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '', role: 'Staff' });
      loadUsers();
      
      // Show success message
      if (emailSent) {
        alert(
          `✅ Користувача створено!\n\n` +
          `📧 На адресу ${inviteForm.email} відправлено посилання для встановлення пароля.\n\n` +
          `Користувач має перейти за посиланням та встановити пароль самостійно.`
        );
      } else {
        alert(
          `✅ Користувача створено!\n\n` +
          `⚠️ Не вдалося відправити email.\n` +
          `Скористайтесь кнопкою "Скинути пароль" щоб надіслати посилання.`
        );
      }
    } catch (err) {
      alert(`❌ Помилка: ${err.message}`);
    }
  };

  const handleResetPassword = async (userId, email) => {
    if (!window.confirm(`Відправити посилання для скидання пароля на ${email}?`)) return;
    
    try {
      await userService.resetPassword(userId, email);
      alert(`✅ Посилання відправлено на ${email}`);
    } catch (err) {
      alert(`❌ Помилка: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading">Завантаження...</div>
      </DashboardLayout>
    );
  }

  const pageContent = (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button onClick={() => setShowInviteModal(true)} className="btn-primary">
            + Запросити користувача
          </button>
        </div>

        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Ім'я</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата створення</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: '600' }}>{user.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px' }}
                    >
                      <option value="Owner">Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px' }}
                    >
                      <option value="active">Активний</option>
                      <option value="inactive">Неактивний</option>
                    </select>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {new Date(user.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td>
                    <button
                      onClick={() => handleResetPassword(user.id, user.email)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      title="Відправити посилання для встановлення нового пароля"
                    >
                      🔑 Скинути пароль
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>
            Користувачів не знайдено
          </div>
        )}

        {showInviteModal && (
          <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <div className="modal-content modal-solid" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Запросити користувача</h2>
              <form onSubmit={handleInvite}>
                <div className="form-group">
                  <label>Email <span style={{color: 'var(--text-secondary)'}}>*</span></label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ім'я <span style={{color: 'var(--text-secondary)'}}>*</span></label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Роль</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary">
                    Скасувати
                  </button>
                  <button type="submit" className="btn-primary">
                    Надіслати запрошення
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );

  return embedded ? pageContent : <DashboardLayout>{pageContent}</DashboardLayout>;
}

export default UsersPage;
