import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    employeeId?: string;
    employeeName?: string;
    batchNumber?: string;
    leaveType?: string;
    leaveDates?: string;
    approverName?: string;
    requestId?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  addLeaveNotification: (type: 'submitted' | 'first_approved' | 'second_approved' | 'rejected', data: any) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('absentra_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(withDates);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('absentra_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50 notifications
  };

  const addLeaveNotification = (type: 'submitted' | 'first_approved' | 'second_approved' | 'rejected', data: any) => {
    const { employee, request, approver, nextApprover } = data;
    
    const metadata = {
      employeeId: employee?.employee_id,
      employeeName: employee?.name,
      batchNumber: employee?.employee_id, // Using employee_id as batch number
      leaveType: request?.leave_type,
      leaveDates: request ? `${new Date(request.from_date).toLocaleDateString()} - ${new Date(request.to_date).toLocaleDateString()}` : '',
      approverName: approver?.name,
      requestId: request?.id
    };

    switch (type) {
      case 'submitted':
        // Notification to First-Level Approver
        addNotification({
          title: 'New Leave Request Requires Approval',
          message: `Leave request from ${employee?.name} (${employee?.employee_id}) for ${request?.leave_type} leave from ${metadata.leaveDates} requires your approval.`,
          type: 'info',
          metadata,
          actionUrl: `/dashboard/leave`
        });
        break;

      case 'first_approved':
        // Notification to Employee (Requester)
        addNotification({
          title: 'Leave Request Approved - First Level',
          message: `Your leave request has been approved by ${approver?.name}. Employee ID: ${employee?.employee_id}, Leave Type: ${request?.leave_type}, Dates: ${metadata.leaveDates}`,
          type: 'success',
          metadata,
          actionUrl: `/dashboard/leave`
        });

        // Notification to Second-Level Approver
        if (nextApprover) {
          addNotification({
            title: 'Leave Request Forwarded for Approval',
            message: `Leave request for ${employee?.name} (${employee?.employee_id}) has been approved by ${approver?.name}. Your approval is now required. Leave Type: ${request?.leave_type}, Dates: ${metadata.leaveDates}`,
            type: 'info',
            metadata,
            actionUrl: `/dashboard/leave`
          });
        }

        // Optional notification to Manager/HR
        addNotification({
          title: 'Leave Request Status Update',
          message: `Leave request of ${employee?.name} (${employee?.employee_id}) is approved by ${approver?.name} and forwarded for next-level approval.`,
          type: 'info',
          metadata,
          actionUrl: `/dashboard/leave`
        });
        break;

      case 'second_approved':
        // Notification to Employee (Requester)
        addNotification({
          title: 'Leave Request Fully Approved',
          message: `Your leave request has been approved by ${approver?.name}. Employee ID: ${employee?.employee_id}, Leave Type: ${request?.leave_type}, Dates: ${metadata.leaveDates}. Your leave is now confirmed.`,
          type: 'success',
          metadata,
          actionUrl: `/dashboard/leave`
        });

        // Optional notification to Manager/HR
        addNotification({
          title: 'Leave Request Fully Approved',
          message: `Leave request of ${employee?.name} (${employee?.employee_id}) is fully approved by ${approver?.name}.`,
          type: 'success',
          metadata,
          actionUrl: `/dashboard/leave`
        });
        break;

      case 'rejected':
        // Notification to Employee (Requester)
        addNotification({
          title: 'Leave Request Rejected',
          message: `Your leave request has been rejected by ${approver?.name}. Employee ID: ${employee?.employee_id}, Leave Type: ${request?.leave_type}, Dates: ${metadata.leaveDates}`,
          type: 'error',
          metadata,
          actionUrl: `/dashboard/leave`
        });
        break;
    }
  };
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Add some sample notifications on first load
  useEffect(() => {
    const hasInitialized = localStorage.getItem('absentra_notifications_initialized');
    if (!hasInitialized) {
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          title: 'Welcome to Absentra',
          message: 'Your account has been set up successfully. You can now submit leave requests and manage your profile.',
          type: 'success',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false
        },
        {
          id: '2',
          title: 'System Maintenance Scheduled',
          message: 'The system will undergo maintenance on Sunday from 2:00 AM to 4:00 AM. Please plan accordingly.',
          type: 'info',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          read: false
        },
        {
          id: '3',
          title: 'Holiday Reminder',
          message: 'Christmas Day is coming up on December 25th. The office will be closed.',
          type: 'info',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          read: true
        }
      ];
      
      setNotifications(sampleNotifications);
      localStorage.setItem('absentra_notifications_initialized', 'true');
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      addLeaveNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};