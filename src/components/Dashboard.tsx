import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

// Role-based dashboard components
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import HRDashboard from './dashboards/HRDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

// Feature components
import LeaveManagement from './features/LeaveManagement';
import LeaveCalendar from './features/LeaveCalendar';
import Profile from './features/Profile';
import EmployeeManagement from './admin/EmployeeManagement';
import DepartmentManagement from './admin/DepartmentManagement';
import UserManagement from './admin/UserManagement';
import HolidayManagement from './admin/HolidayManagement';
import Reports from './admin/Reports';
import LeavePolicyManagement from './admin/LeavePolicyManagement';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'line_manager':
        return <ManagerDashboard />;
      case 'employee':
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={getDashboardComponent()} />
            <Route path="/leave" element={<LeaveManagement />} />
            <Route path="/calendar" element={<LeaveCalendar />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin and HR routes */}
            {(user?.role === 'admin' || user?.role === 'hr') && (
              <>
                <Route path="/reports" element={<Reports />} />
              </>
            )}
            
            {/* Admin only routes */}
            {user?.role === 'admin' && (
              <>
                <Route path="/employees" element={<EmployeeManagement />} />
                <Route path="/departments" element={<DepartmentManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/holidays" element={<HolidayManagement />} />
                <Route path="/policies" element={<LeavePolicyManagement />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;