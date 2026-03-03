import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { usePageTitle } from '../context/PageTitleContext';
import counterpartyService from '../services/counterpartyService';
import './CounterpartiesPage.css';

export default function CounterpartiesPage({ embedded = false }) {
  const [counterparties, setCounterparties] = useState([]);
  const { setPageTitle } = usePageTitle();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list, icon, column, gallery
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadData();
  }, [selectedFolder, searchQuery]);

  const getAllTags = () => {
    const tags = new Set();
    counterparties.forEach((cp) => {
      if (cp.tags) cp.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  const filteredCounterparties = counterparties.filter((cp) => {
    if (selectedTags.length > 0) {
      if (!cp.tags || !selectedTags.some((t) => cp.tags.includes(t))) {
        return false;
      }
    }
    return true;
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cpData, foldersData] = await Promise.all([
        counterpartyService.getAll({ folder_id: selectedFolder, search: searchQuery }),
        counterpartyService.getFolders(),
      ]);
      setCounterparties(cpData);
  const { setPageTitle } = usePageTitle();
      setFolders(foldersData);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        await counterpartyService.update(editingItem.id, formData);
      } else {
        await counterpartyService.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Видалити контрагента?')) return;
    try {
      await counterpartyService.delete(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (formData) => {
    try {
      if (editingFolder) {
        await counterpartyService.updateFolder(editingFolder.id, formData);
      } else {
        await counterpartyService.createFolder(formData);
      }
      setShowFolderModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!confirm('Видалити папку? Контрагенти залишаться без папки.')) return;
    try {
      await counterpartyService.deleteFolder(id);
      if (selectedFolder === id) setSelectedFolder(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDragStart = (e, counterparty) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('counterpartyId', counterparty.id);
  };

  const handleDrop = async (e, folderId) => {
    e.preventDefault();
    const counterpartyId = e.dataTransfer.getData('counterpartyId');
    if (!counterpartyId) return;

    try {
      await counterpartyService.moveToFolder(counterpartyId, folderId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const pageContent = (
    <div className="counterparties-page">
        {/* Toolbar */}
        <div className="cp-toolbar">
          <div className="cp-toolbar-left">
            <h1>Контрагенти</h1>
          </div>
          <div className="cp-toolbar-center">
            <input
              type="text"
              placeholder="Пошук..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cp-search"
            />
          </div>
          <div className="cp-toolbar-right">
            <div className="cp-view-switcher">
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="Список"
              >
                ☰
              </button>
              <button
                className={viewMode === 'icon' ? 'active' : ''}
                onClick={() => setViewMode('icon')}
                title="Сітка"
              >
                ⊞
              </button>
            </div>
            <button className="btn-primary" onClick={handleCreate}>
              + Новий
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="cp-main">
          {/* Sidebar with folders */}
          <div className="cp-sidebar">
            <div className="cp-sidebar-header">
              <h3>Папки</h3>
              <button className="btn-sm" onClick={handleCreateFolder} title="Нова папка">
                +
              </button>
            </div>
            <ul className="cp-folder-list">
              <li
                className={selectedFolder === null ? 'active' : ''}
                onClick={() => setSelectedFolder(null)}
                onDrop={(e) => handleDrop(e, null)}
                onDragOver={handleDragOver}
              >
                Усі контрагенти
              </li>
              {folders.map((folder) => (
                <li
                  key={folder.id}
                  className={selectedFolder === folder.id ? 'active' : ''}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  onDragOver={handleDragOver}
                >
                  <span onClick={() => setSelectedFolder(folder.id)}>
                    📁 {folder.name}
                  </span>
                  <button
                    className="folder-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    title="Видалити папку"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Content area */}
          <div className="cp-content">
            {loading ? (
              <div>Завантаження...</div>
            ) : viewMode === 'list' ? (
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Назва</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>ІПН/ЄДРПОУ</th>
                    <th>Теги</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCounterparties.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#6b7280' }}>
                        Немає контрагентів
                      </td>
                    </tr>
                  ) : (
                    filteredCounterparties.map((cp) => (
                      <tr
                        key={cp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cp)}
                        style={{ cursor: 'move' }}
                      >
                        <td>{cp.name}</td>
                        <td>{cp.email || '—'}</td>
                        <td>{cp.phone || '—'}</td>
                        <td>{cp.tax_id || '—'}</td>
                        <td>
                          {cp.tags && cp.tags.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {cp.tags.map((tag, i) => (
                                <span key={i} className="tag-badge">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <button onClick={() => handleEdit(cp)} className="btn-sm">
                            Редагувати
                          </button>
                          <button onClick={() => handleDelete(cp.id)} className="btn-sm btn-danger">
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <div className="cp-icon-grid">
                {filteredCounterparties.map((cp) => (
                  <div key={cp.id} className="cp-icon-card" onClick={() => handleEdit(cp)}>
                    <div className="cp-icon">👤</div>
                    <div className="cp-icon-name">{cp.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <CounterpartyModal
            item={editingItem}
            folders={folders}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}

        {/* Folder Modal */}
        {showFolderModal && (
          <FolderModal
            folder={editingFolder}
            onSave={handleSaveFolder}
            onClose={() => setShowFolderModal(false)}
          />
        )}
    </div>
  );

  return embedded ? pageContent : <DashboardLayout>{pageContent}</DashboardLayout>;
}

function CounterpartyModal({ item, folders, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    full_name: item?.full_name || '',
    tax_id: item?.tax_id || '',
    contact_person: item?.contact_person || '',
    email: item?.email || '',
    phone: item?.phone || '',
    address: item?.address || '',
    notes: item?.notes || '',
    folder_id: item?.folder_id || null,
    tags: item?.tags || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Назва обов'язкова");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Редагувати контрагента' : 'Новий контрагент'}</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Назва *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Повна назва</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>ІПН/ЄДРПОУ</label>
            <input
              type="text"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Контактна особа</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Адреса</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Папка</label>
            <select
              value={formData.folder_id || ''}
              onChange={(e) => setFormData({ ...formData, folder_id: e.target.value || null })}
            >
              <option value="">Без папки</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Теги (через кому)</label>
            <input
              type="text"
              placeholder="клієнт, vip, партнер"
              value={formData.tags ? formData.tags.join(', ') : ''}
              onChange={(e) => {
                const tags = e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0);
                setFormData({ ...formData, tags });
              }}
            />
          </div>

          <div className="form-group">
            <label>Нотатки</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Скасувати
            </button>
            <button type="submit" className="btn-primary">
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FolderModal({ folder, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: folder?.name || '',
    color: folder?.color || '',
    icon: folder?.icon || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Назва папки обов'язкова");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-solid" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{folder ? 'Редагувати папку' : 'Нова папка'}</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Назва папки *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Колір (опціонально)</label>
            <input
              type="text"
              placeholder="#FF5733"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Іконка (опціонально)</label>
            <input
              type="text"
              placeholder="📁"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Скасувати
            </button>
            <button type="submit" className="btn-primary">
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
