import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { usePageTitle } from '../../context/PageTitleContext';
import reportService from '../../services/reportService';
import './ReportPages.css';

export default function ProfitLossReportPage() {
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setPageTitle('Звіт про прибутки та збитки (P&L)');
    loadReport();
  }, [setPageTitle]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getProfitLoss(startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error(err);
      alert('Помилка завантаження звіту');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `€${Number(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="report-page">
          <div className="loading">Завантаження...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="report-page">
        <div className="report-header glass-card">
          <div className="report-title-section">
            <h2>Звіт про прибутки та збитки</h2>
            <p className="report-period">За період з {new Date(startDate).toLocaleDateString('uk-UA')} по {new Date(endDate).toLocaleDateString('uk-UA')}</p>
          </div>

          <div className="report-filters">
            <div className="filter-group">
              <label>Від</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>До</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button onClick={loadReport} className="btn-primary">
              Оновити
            </button>
          </div>
        </div>

        <div className="report-content glass-card">
          <table className="report-table">
            <thead>
              <tr>
                <th>Стаття</th>
                <th style={{ textAlign: 'right' }}>Сума (EUR)</th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr className="section-header">
                <td colSpan="2"><strong>Доходи</strong></td>
              </tr>
              {report?.revenue?.map((item) => (
                <tr key={item.account_code}>
                  <td className="indent-1">{item.account_code} - {item.account_name}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.amount)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Всього доходів</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.total_revenue)}</strong></td>
              </tr>

              {/* Expenses Section */}
              <tr className="section-header">
                <td colSpan="2"><strong>Витрати</strong></td>
              </tr>
              {report?.expenses?.map((item) => (
                <tr key={item.account_code}>
                  <td className="indent-1">{item.account_code} - {item.account_name}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.amount)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Всього витрат</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.total_expenses)}</strong></td>
              </tr>

              {/* Net Profit */}
              <tr className="total">
                <td><strong>Чистий прибуток / (збиток)</strong></td>
                <td style={{ textAlign: 'right' }}>
                  <strong className={report?.net_profit >= 0 ? 'profit' : 'loss'}>
                    {formatAmount(report?.net_profit)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>

          {(!report?.revenue?.length && !report?.expenses?.length) && (
            <div className="empty-state">
              <p>Немає даних за вибраний період</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
