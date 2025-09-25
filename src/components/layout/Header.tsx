import React from 'react';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Search } from 'lucide-react';
import NotificationDropdown from '../ui/NotificationDropdown';
import { useNotifications } from '../../contexts/NotificationContext';

const Header: React.FC = () => {
  const { user } = useAuth();
  const { getEmployeeByUserId, employees } = useData();
  const { notifications, markAsRead, markAllAsRead, clearAll, addLeaveNotification } = useNotifications();
  
  const employee = user ? getEmployeeByUserId(user.id) : null;

  // Listen for leave request events and trigger notifications
  useEffect(() => {
    const handleLeaveRequestSubmitted = (event: CustomEvent) => {
      const { employee, request } = event.detail;
      addLeaveNotification('submitted', { employee, request });
    };

    const handleLeaveRequestApproved = (event: CustomEvent) => {
      const { employee, request, approver, isFullyApproved } = event.detail;
      if (isFullyApproved) {
        addLeaveNotification('second_approved', { employee, request, approver });
      } else {
        // Find next approver for notification
        const nextApproval = request.approvals?.find((a: any) => a.is_current);
        const nextApprover = nextApproval ? employees.find(emp => emp.id === nextApproval.approver_id) : null;
        addLeaveNotification('first_approved', { employee, request, approver, nextApprover });
      }
    };

    const handleLeaveRequestRejected = (event: CustomEvent) => {
      const { employee, request, approver } = event.detail;
      addLeaveNotification('rejected', { employee, request, approver });
    };

    window.addEventListener('leaveRequestSubmitted', handleLeaveRequestSubmitted as EventListener);
    window.addEventListener('leaveRequestApproved', handleLeaveRequestApproved as EventListener);
    window.addEventListener('leaveRequestRejected', handleLeaveRequestRejected as EventListener);

    return () => {
      window.removeEventListener('leaveRequestSubmitted', handleLeaveRequestSubmitted as EventListener);
      window.removeEventListener('leaveRequestApproved', handleLeaveRequestApproved as EventListener);
      window.removeEventListener('leaveRequestRejected', handleLeaveRequestRejected as EventListener);
    };
  }, [addLeaveNotification, employees]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {employee?.name || user?.username}!
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          
          {/* Notifications Dropdown */}
          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;