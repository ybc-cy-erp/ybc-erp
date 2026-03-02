import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { usePageTitle } from '../context/PageTitleContext';
import documentService from '../services/documentService';
import './DocumentsPage.css';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setPageTitle('Журнал документів');
    loadDocuments();
  }, [filterType, filterStatus]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') params.doc_type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      
      const data = await documentService.getAll(params);
      setDocuments(data);
  const { setPageTitle } = usePageTitle();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!confirm('Провести документ?')) return;
    try {
      await documentService.post(id);
      loadDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const labels = { draft: 'Черновик', posted: 'Проведен', cancelled: 'Отменен' };
    return labels[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="documents-page">
        <div className="documents-toolbar">
          <h1>Журнал документов</h1>
          <div className="documents-filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Все типы</option>
              <option value="PKO">ПКО</option>
              <option value="RKO">РКО</option>
              <option value="invoice">Счета</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Все статусы</option>
              <option value="draft">Черновики</option>
              <option value="posted">Проведенные</option>
              <option value="cancelled">Отмененные</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div>Загрузка...</div>
        ) : (
          <table className="documents-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Номер</th>
                <th>Контрагент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#6b7280' }}>
                    Нет документов
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{new Date(doc.doc_date).toLocaleDateString('ru-RU')}</td>
                    <td>{doc.doc_type}</td>
                    <td>{doc.doc_number}</td>
                    <td>{doc.counterparties?.name || '—'}</td>
                    <td>
                      {doc.amount ? `${Number(doc.amount).toFixed(2)} ${doc.currency}` : '—'}
                    </td>
                    <td>
                      <span className={`status-badge status-${doc.status}`}>
                        {getStatusBadge(doc.status)}
                      </span>
                    </td>
                    <td>
                      {doc.status === 'draft' && (
                        <button onClick={() => handlePost(doc.id)} className="btn-sm">
                          Провести
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
