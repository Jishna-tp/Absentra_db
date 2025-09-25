import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, Calendar, FileText, User, Users, Building2, 
  Settings, BarChart3, Clock, LogOut, Shield 
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      roles: ['employee', 'line_manager', 'hr', 'admin']
    },
    {
      path: '/dashboard/leave',
      label: 'Leave Management',
      icon: <FileText className="w-5 h-5" />,
      roles: ['employee', 'line_manager', 'hr', 'admin']
    },
    {
      path: '/dashboard/calendar',
      label: 'Calendar',
      icon: <Calendar className="w-5 h-5" />,
      roles: ['employee', 'line_manager', 'hr', 'admin']
    },
    {
      path: '/dashboard/profile',
      label: 'My Profile',
      icon: <User className="w-5 h-5" />,
      roles: ['employee', 'line_manager', 'hr', 'admin']
    },
    // Admin only items
    {
      path: '/dashboard/employees',
      label: 'Employee Management',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      path: '/dashboard/departments',
      label: 'Department Management',
      icon: <Building2 className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      path: '/dashboard/users',
      label: 'User Management',
      icon: <Settings className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      path: '/dashboard/holidays',
      label: 'Holiday Management',
      icon: <Clock className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      path: '/dashboard/policies',
      label: 'Leave Policies',
      icon: <Shield className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      path: '/dashboard/reports',
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['hr', 'admin']
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Absentra</h1>
            <p className="text-xs text-gray-500">Leave Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;