import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { UserRole } from '../../types';
import { Settings, Plus, Edit, Lock, Shield, Search, User, AlertCircle, ChevronDown } from 'lucide-react';

const UserManagement: React.FC = () => {
  const { employees, users, addUser, updateUser, resetUserPassword } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    employee_id: '',
    role: 'employee' as UserRole,
    is_active: true
  });

  // Get employees that don't have user accounts yet
  const availableEmployees = employees.filter(emp => 
    emp.status === 'active' && 
    !users.some(user => user.employee_id === emp.employee_id) &&
    (emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
     emp.employee_id.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
  );

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!formData.username.trim()) {
      newErrors.push('Username is required');
    } else if (formData.username.length < 3) {
      newErrors.push('Username must be at least 3 characters');
    } else if (users.some(u => u.username === formData.username && u.id !== editingUser)) {
      newErrors.push('Username already exists');
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push('Please enter a valid email address');
    }
    
    if (formData.email && users.some(u => u.email === formData.email && u.id !== editingUser)) {
      newErrors.push('Email already exists');
    }
    
    if (!editingUser && !formData.password) {
      newErrors.push('Password is required');
    } else if (formData.password && formData.password.length < 8) {
      newErrors.push('Password must be at least 8 characters');
    }
    
    if (!editingUser && !selectedEmployee) {
      newErrors.push('Please select an employee');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const userData = {
        ...formData,
        employee_id: selectedEmployee?.employee_id || formData.employee_id
      };
      
      if (editingUser) {
        updateUser(editingUser, userData);
      } else {
        addUser(userData);
      }
      
      // Show success message
      setTimeout(() => {
        const event = new CustomEvent('showToast', {
          detail: {
            type: 'success',
            title: editingUser ? 'User Updated' : 'User Created',
            message: `User ${formData.username} has been ${editingUser ? 'updated' : 'created'} successfully.`
          }
        });
        window.dispatchEvent(event);
      }, 100);
      
      resetForm();
    } catch (error) {
      setErrors(['An error occurred while saving the user.']);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      employee_id: '',
      role: 'employee',
      is_active: true
    });
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setErrors([]);
    setShowAddForm(false);
    setEditingUser(null);
    setShowEmployeeDropdown(false);
  };

  const handleEdit = (user: any) => {
    const employee = employees.find(emp => emp.employee_id === user.employee_id);
    setFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      employee_id: user.employee_id,
      role: user.role,
      is_active: user.is_active
    });
    setSelectedEmployee(employee);
    setEditingUser(user.id);
    setShowAddForm(true);
  };

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({ ...formData, employee_id: employee.employee_id });
    setShowEmployeeDropdown(false);
    setEmployeeSearchTerm('');
  };

  const handleResetPassword = (userId: string, username: string) => {
    if (window.confirm(`Reset password for user ${username}?`)) {
      const tempPassword = resetUserPassword(userId);
      
      setTimeout(() => {
        const event = new CustomEvent('showToast', {
          detail: {
            type: 'success',
            title: 'Password Reset',
            message: `Password has been reset for ${username}. Temporary password: ${tempPassword}`
          }
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'hr':
        return 'bg-purple-100 text-purple-800';
      case 'line_manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'hr':
        return <Settings className="w-4 h-4" />;
      case 'line_manager':
        return <Settings className="w-4 h-4" />;
      case 'employee':
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user accounts and access permissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h3>
          
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Please fix the following errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              {editingUser ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employee_id})` : 'Employee not found'}
                  <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>
                </div>
              ) : (
                <div className="relative">
                  <div
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white flex items-center justify-between"
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {selectedEmployee ? (
                        <>
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{selectedEmployee.name} ({selectedEmployee.employee_id})</span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Select an employee...</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showEmployeeDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {showEmployeeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search employees..."
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto">
                        {availableEmployees.length === 0 ? (
                          <div className="p-3 text-center text-gray-500">
                            {employeeSearchTerm ? 'No employees found matching your search' : 'No available employees'}
                          </div>
                        ) : (
                          availableEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                              onClick={() => handleEmployeeSelect(employee)}
                            >
                              <div className="font-medium text-gray-900">{employee.name} ({employee.employee_id})</div>
                              <div className="text-sm text-gray-600">{employee.position}</div>
                              {employee.department && (
                                <div className="text-xs text-gray-500">{employee.department.name}</div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingUser ? 'New Password' : 'Password *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required={!editingUser}
                placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password (min 8 characters)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="employee">Employee</option>
                <option value="line_manager">Line Manager</option>
                <option value="hr">HR Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {editingUser && (
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active Account
                  </label>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Role Permissions:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {formData.role === 'admin' && (
                    <>
                      <li>• Full system administration access</li>
                      <li>• Manage all users, employees, and departments</li>
                      <li>• Configure system settings and workflows</li>
                    </>
                  )}
                  {formData.role === 'hr' && (
                    <>
                      <li>• View and manage all employee leave requests</li>
                      <li>• Generate reports and analytics</li>
                      <li>• Manage company holidays</li>
                    </>
                  )}
                  {formData.role === 'line_manager' && (
                    <>
                      <li>• Approve/reject team member leave requests</li>
                      <li>• View team leave schedules</li>
                      <li>• First-level approval authority</li>
                    </>
                  )}
                  {formData.role === 'employee' && (
                    <>
                      <li>• Submit and manage personal leave requests</li>
                      <li>• View personal leave balance and history</li>
                      <li>• Access personal profile and calendar</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-600">User</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Employee ID</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Role</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Created</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Last Login</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.username}</div>
                        {user.email && (
                          <div className="text-sm text-gray-600">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900">{user.employee_id}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id, user.username)}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        <Lock className="w-4 h-4" />
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['admin', 'hr', 'line_manager', 'employee'].map((role) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  role === 'admin' ? 'bg-red-100' :
                  role === 'hr' ? 'bg-purple-100' :
                  role === 'line_manager' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {getRoleIcon(role as UserRole)}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default UserManagement;