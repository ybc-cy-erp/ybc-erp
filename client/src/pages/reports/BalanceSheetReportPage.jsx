import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { usePageTitle } from '../../context/PageTitleContext';
import reportService from '../../services/reportService';
import './ReportPages.css';

export default function BalanceSheetReportPage() {
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setPageTitle('Балансовий звіт');
    loadReport();
  }, [setPageTitle]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getBalanceSheet(asOfDate);
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
            <h2>Балансовий звіт</h2>
            <p className="report-period">Станом на {new Date(asOfDate).toLocaleDateString('uk-UA')}</p>
          </div>

          <div className="report-filters">
            <div className="filter-group">
              <label>Дата</label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
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
              {/* Assets Section */}
              <tr className="section-header">
                <td colSpan="2"><strong>АКТИВИ</strong></td>
              </tr>
              {report?.assets?.map((item) => (
                <tr key={item.account_code}>
                  <td className="indent-1">{item.account_code} - {item.account_name}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.balance)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Всього активів</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.total_assets)}</strong></td>
              </tr>

              <tr style={{ height: '20px' }}></tr>

              {/* Liabilities Section */}
              <tr className="section-header">
                <td colSpan="2"><strong>ЗОБОВ'ЯЗАННЯ</strong></td>
              </tr>
              {report?.liabilities?.map((item) => (
                <tr key={item.account_code}>
                  <td className="indent-1">{item.account_code} - {item.account_name}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.balance)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Всього зобов'язань</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.total_liabilities)}</strong></td>
              </tr>

              <tr style={{ height: '20px' }}></tr>

              {/* Equity Section */}
              <tr className="section-header">
                <td colSpan="2"><strong>КАПІТАЛ</strong></td>
              </tr>
              {report?.equity?.map((item) => (
                <tr key={item.account_code}>
                  <td className="indent-1">{item.account_code} - {item.account_name}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.balance)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Всього капіталу</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.total_equity)}</strong></td>
              </tr>

              {/* Total Liabilities + Equity */}
              <tr className="total">
                <td><strong>Всього зобов'язань та капіталу</strong></td>
                <td style={{ textAlign: 'right' }}>
                  <strong>{formatAmount(report?.total_liabilities + report?.total_equity)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {(!report?.assets?.length && !report?.liabilities?.length && !report?.equity?.length) && (
            <div className="empty-state">
              <p>Немає даних на вибрану дату</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
