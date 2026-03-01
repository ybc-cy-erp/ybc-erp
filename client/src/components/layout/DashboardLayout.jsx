import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}
