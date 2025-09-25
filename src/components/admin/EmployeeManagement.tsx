import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Users, Plus, Edit, Search, Filter } from 'lucide-react';

const EmployeeManagement: React.FC = () => {
  const { employees, departments, addEmployee, updateEmployee, generateNextEmployeeId, isGeneratingId } = useData();
  const location = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoadingId, setIsLoadingId] = useState(false);
  const [idGenerationError, setIdGenerationError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    department_id: '',
    position: '',
    manager_id: '',
    joining_date: '',
    email: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Initialize department filter from URL params
  const urlParams = new URLSearchParams(location.search);
  const initialDepartmentFilter = urlParams.get('department') || '';
  const departmentName = urlParams.get('departmentName') || '';
  const [departmentFilter, setDepartmentFilter] = useState(initialDepartmentFilter);

  // Auto-generate employee ID when opening add form
  const handleShowAddForm = async () => {
    if (!showAddForm) {
      setIsLoadingId(true);
      setIdGenerationError('');
      
      try {
        const newEmployeeId = await generateNextEmployeeId();
        setFormData(prev => ({
          ...prev,
          employee_id: newEmployeeId
        }));
        setShowAddForm(true);
      } catch (error) {
        setIdGenerationError('Failed to generate Employee ID. Please try again.');
        console.error('Employee ID generation error:', error);
      } finally {
        setIsLoadingId(false);
      }
    } else {
      setShowAddForm(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.position.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (departmentFilter === '' || emp.department_id === departmentFilter) &&
    (statusFilter === '' || emp.status === statusFilter)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        updateEmployee(editingEmployee, formData);
        setEditingEmployee(null);
      } else {
        addEmployee(formData);
      }
      resetForm();
      
      // Show success message
      setTimeout(() => {
        const event = new CustomEvent('showToast', {
          detail: {
            type: 'success',
            title: editingEmployee ? 'Employee Updated' : 'Employee Added',
            message: `${formData.name} has been ${editingEmployee ? 'updated' : 'added'} successfully.`
          }
        });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      // Show error message
      setTimeout(() => {
        const event = new CustomEvent('showToast', {
          detail: {
            type: 'error',
            title: 'Error',
            message: error instanceof Error ? error.message : 'An error occurred while saving the employee.'
          }
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      employee_id: '',
      department_id: '',
      position: '',
      manager_id: '',
      joining_date: '',
      email: '',
      status: 'active'
    });
    setShowAddForm(false);
    setIdGenerationError('');
  };

  const handleEdit = (employee: any) => {
    setFormData({
      name: employee.name,
      employee_id: employee.employee_id,
      department_id: employee.department_id,
      position: employee.position,
      manager_id: employee.manager_id || '',
      joining_date: employee.joining_date,
      email: employee.email || '',
      status: employee.status
    });
    setEditingEmployee(employee.id);
    setShowAddForm(true);
  };

  const managers = employees.filter(emp => emp.position.toLowerCase().includes('manager') || emp.position.toLowerCase().includes('lead'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Management
              {departmentName && (
                <span className="text-lg font-normal text-blue-600 ml-2">
                  - {departmentName}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              {departmentName 
                ? `Showing employees in ${departmentName} department`
                : 'Manage employee records and information'
              }
            </p>
          </div>
        </div>
        <button
          onClick={handleShowAddForm}
          disabled={isLoadingId || isGeneratingId}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          {isLoadingId || isGeneratingId ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isLoadingId || isGeneratingId ? 'Generating ID...' : 'Add Employee'}
        </button>
      </div>

      {/* ID Generation Error */}
      {idGenerationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{idGenerationError}</p>
          <button
            onClick={handleShowAddForm}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID * {!editingEmployee && <span className="text-xs text-gray-500">(Auto-generated)</span>}
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !editingEmployee ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                readOnly={!editingEmployee}
                required
                placeholder={!editingEmployee ? 'Auto-generated...' : 'Enter employee ID'}
              />
              {!editingEmployee && (
                <p className="text-xs text-gray-500 mt-1">
                  Employee ID is automatically generated and cannot be modified
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager
              </label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Manager</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joining Date *
              </label>
              <input
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
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

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(departmentFilter || statusFilter || searchTerm) && (
              <button
                onClick={() => {
                  setDepartmentFilter('');
                  setStatusFilter('');
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Employee</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">ID</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Department</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Position</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Joining Date</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const department = departments.find(dept => dept.id === employee.department_id);
                const manager = employees.find(emp => emp.id === employee.manager_id);
                
                return (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        {employee.email && (
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">{employee.employee_id}</td>
                    <td className="py-4 px-6 text-gray-900">{department?.name || '-'}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-gray-900">{employee.position}</div>
                        {manager && (
                          <div className="text-sm text-gray-500">Reports to: {manager.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {new Date(employee.joining_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      `}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;