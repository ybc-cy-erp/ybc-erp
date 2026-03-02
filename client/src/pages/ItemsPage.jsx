import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { usePageTitle } from '../context/PageTitleContext';
import itemService from '../services/itemService';
import './ItemsPage.css';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const { setPageTitle } = usePageTitle();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadData();
  }, [selectedFolder, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, foldersData] = await Promise.all([
        itemService.getAll({ folder_id: selectedFolder, search: searchQuery }),
        itemService.getFolders(),
      ]);
      setItems(itemsData);
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
        await itemService.update(editingItem.id, formData);
      } else {
        await itemService.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Видалити товар/послугу?')) return;
    try {
      await itemService.delete(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateFolder = () => {
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (formData) => {
    try {
      await itemService.createFolder(formData);
      setShowFolderModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteFolder = async (id) => {
    if (!confirm('Видалити папку? Товари/послуги залишаться без папки.')) return;
    try {
      await itemService.deleteFolder(id);
      if (selectedFolder === id) setSelectedFolder(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('itemId', item.id);
  };

  const handleDrop = async (e, folderId) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    if (!itemId) return;

    try {
      await itemService.update(itemId, { folder_id: folderId });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const getAllTags = () => {
    const tags = new Set();
    items.forEach((item) => {
      if (item.tags) item.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  const filteredItems = items.filter((item) => {
    if (selectedType !== 'all' && item.item_type !== selectedType) return false;
    if (selectedTags.length > 0) {
      if (!item.tags || !selectedTags.some((t) => item.tags.includes(t))) return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="items-page">
        <div className="items-toolbar">
          <div className="items-toolbar-left">
            <h1>Товари та послуги</h1>
          </div>
          <div className="items-toolbar-center">
            <input
              type="text"
              placeholder="Пошук..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="items-search"
            />
          </div>
          <div className="items-toolbar-right">
            <div className="items-view-switcher">
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

        <div className="items-main">
          <div className="items-sidebar">
            <div className="items-sidebar-header">
              <h3>Папки</h3>
              <button className="btn-sm" onClick={handleCreateFolder} title="Нова папка">
                +
              </button>
            </div>
            <ul className="items-folder-list">
              <li
                className={selectedFolder === null ? 'active' : ''}
                onClick={() => setSelectedFolder(null)}
                onDrop={(e) => handleDrop(e, null)}
                onDragOver={handleDragOver}
              >
                Усі товари та послуги
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

          <div className="items-content">
            {loading ? (
              <div>Завантаження...</div>
            ) : viewMode === 'list' ? (
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Код</th>
                    <th>Назва</th>
                    <th>Тип</th>
                    <th>Ціна</th>
                    <th>Од.</th>
                    <th>Теги</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280' }}>
                        Немає товарів/послуг
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        style={{ cursor: 'move' }}
                      >
                        <td>{item.code || '—'}</td>
                        <td>{item.name}</td>
                        <td>{getItemTypeLabel(item.item_type)}</td>
                        <td>
                          {item.price_default
                            ? `${Number(item.price_default).toFixed(2)} ${item.currency}`
                            : '—'}
                        </td>
                        <td>{item.unit}</td>
                        <td>
                          {item.tags && item.tags.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {item.tags.map((tag, i) => (
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
                          <button onClick={() => handleEdit(item)} className="btn-sm">
                            Редагувати
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="btn-sm btn-danger">
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <div className="items-icon-grid">
                {filteredItems.map((item) => (
                  <div key={item.id} className="items-icon-card" onClick={() => handleEdit(item)}>
                    <div className="items-icon">
                      {item.item_type === 'service' ? '⚙️' : '📦'}
                    </div>
                    <div className="items-icon-name">{item.name}</div>
                    {item.price_default && (
                      <div className="items-icon-price">
                        {Number(item.price_default).toFixed(2)} {item.currency}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <ItemModal
            item={editingItem}
            folders={folders}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}

        {showFolderModal && (
          <FolderModal
            onSave={handleSaveFolder}
            onClose={() => setShowFolderModal(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function getItemTypeLabel(type) {
  const labels = {
    product: 'Товар',
    service: 'Послуга',
    membership: 'Членство',
  };
  return labels[type] || type;
}

function ItemModal({ item, folders, onSave, onClose }) {
  const [formData, setFormData] = useState({
    code: item?.code || '',
    name: item?.name || '',
    description: item?.description || '',
    unit: item?.unit || 'шт',
    price_default: item?.price_default || '',
    currency: item?.currency || 'EUR',
    item_type: item?.item_type || 'product',
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
          <h2>{item ? 'Редагувати товар/послугу' : 'Новий товар/послуга'}</h2>
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
            <label>Код/Артикул</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Тип</label>
            <select
              value={formData.item_type}
              onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
            >
              <option value="product">Товар</option>
              <option value="service">Послуга</option>
              <option value="membership">Членство</option>
            </select>
          </div>

          <div className="form-group">
            <label>Ціна</label>
            <input
              type="number"
              step="0.01"
              value={formData.price_default}
              onChange={(e) => setFormData({ ...formData, price_default: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Валюта</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="UAH">UAH</option>
            </select>
          </div>

          <div className="form-group">
            <label>Одиниця виміру</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Опис</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
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
              placeholder="новинка, акція, популярне"
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

function FolderModal({ onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
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
          <h2>Нова папка</h2>
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
