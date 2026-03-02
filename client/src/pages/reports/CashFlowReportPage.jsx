import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { usePageTitle } from '../../context/PageTitleContext';
import reportService from '../../services/reportService';
import './ReportPages.css';

export default function CashFlowReportPage() {
  const { setPageTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setPageTitle('Звіт про рух грошових коштів');
    loadReport();
  }, [setPageTitle]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getCashFlow(startDate, endDate);
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
            <h2>Звіт про рух грошових коштів</h2>
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
              {/* Operating Activities */}
              <tr className="section-header">
                <td colSpan="2"><strong>Операційна діяльність</strong></td>
              </tr>
              {report?.operating?.map((item, idx) => (
                <tr key={idx}>
                  <td className="indent-1">{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.amount)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Грошовий потік від операційної діяльності</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.net_operating)}</strong></td>
              </tr>

              <tr style={{ height: '16px' }}></tr>

              {/* Investing Activities */}
              <tr className="section-header">
                <td colSpan="2"><strong>Інвестиційна діяльність</strong></td>
              </tr>
              {report?.investing?.map((item, idx) => (
                <tr key={idx}>
                  <td className="indent-1">{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.amount)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Грошовий потік від інвестиційної діяльності</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.net_investing)}</strong></td>
              </tr>

              <tr style={{ height: '16px' }}></tr>

              {/* Financing Activities */}
              <tr className="section-header">
                <td colSpan="2"><strong>Фінансова діяльність</strong></td>
              </tr>
              {report?.financing?.map((item, idx) => (
                <tr key={idx}>
                  <td className="indent-1">{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(item.amount)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td><strong>Грошовий потік від фінансової діяльності</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.net_financing)}</strong></td>
              </tr>

              <tr style={{ height: '20px' }}></tr>

              {/* Net Change */}
              <tr className="total">
                <td><strong>Чиста зміна грошових коштів</strong></td>
                <td style={{ textAlign: 'right' }}>
                  <strong className={report?.net_change >= 0 ? 'profit' : 'loss'}>
                    {formatAmount(report?.net_change)}
                  </strong>
                </td>
              </tr>
              
              <tr>
                <td>Грошові кошти на початок періоду</td>
                <td style={{ textAlign: 'right' }}>{formatAmount(report?.cash_beginning)}</td>
              </tr>
              
              <tr className="total">
                <td><strong>Грошові кошти на кінець періоду</strong></td>
                <td style={{ textAlign: 'right' }}><strong>{formatAmount(report?.cash_ending)}</strong></td>
              </tr>
            </tbody>
          </table>

          {(!report?.operating?.length && !report?.investing?.length && !report?.financing?.length) && (
            <div className="empty-state">
              <p>Немає даних за вибраний період</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
