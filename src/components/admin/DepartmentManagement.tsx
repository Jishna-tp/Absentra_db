import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Building2, Plus, Edit, Trash2, Users } from 'lucide-react';

const DepartmentManagement: React.FC = () => {
  const { departments, employees, addDepartment, updateDepartment, deleteDepartment } = useData();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDepartment) {
      updateDepartment(editingDepartment, formData);
      setEditingDepartment(null);
    } else {
      addDepartment(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (department: any) => {
    setFormData({
      name: department.name,
      description: department.description || ''
    });
    setEditingDepartment(department.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteDepartment(id);
    }
  };

  const handleShowEmployees = (departmentId: string, departmentName: string) => {
    // Navigate to employee management with department filter
    navigate(`/dashboard/employees?department=${departmentId}&departmentName=${encodeURIComponent(departmentName)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
            <p className="text-gray-600">Manage organizational departments and structures</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDepartment ? 'Edit Department' : 'Add New Department'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                placeholder="e.g., Human Resources"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Brief description of the department's role and responsibilities..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {editingDepartment ? 'Update Department' : 'Add Department'}
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

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => {
          const departmentEmployees = employees.filter(emp => emp.department_id === department.id);
          const activeEmployees = departmentEmployees.filter(emp => emp.status === 'active');
          
          return (
            <div key={department.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-500">
                      {activeEmployees.length} active employee{activeEmployees.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(department)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {department.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{department.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Employees:</span>
                  <span className="font-medium text-gray-900">{departmentEmployees.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium text-green-600">{activeEmployees.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Inactive:</span>
                  <span className="font-medium text-red-600">{departmentEmployees.length - activeEmployees.length}</span>
                </div>
              </div>

              {departmentEmployees.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleShowEmployees(department.id, department.name)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Show Employees ({departmentEmployees.length})
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {departments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first department.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Department
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;