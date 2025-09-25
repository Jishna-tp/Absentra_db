import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { LeaveType } from '../../types';
import { Shield, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

const LeavePolicyManagement: React.FC = () => {
  const { leavePolicies, addLeavePolicy, updateLeavePolicy } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    leave_type: 'casual' as LeaveType,
    annual_limit: 12,
    min_days_notice: 2,
    max_consecutive_days: 5,
    carry_forward_allowed: true,
    carry_forward_limit: 5,
    requires_medical_certificate: false,
    is_active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPolicy) {
      updateLeavePolicy(editingPolicy, formData);
      setEditingPolicy(null);
    } else {
      addLeavePolicy(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      leave_type: 'casual',
      annual_limit: 12,
      min_days_notice: 2,
      max_consecutive_days: 5,
      carry_forward_allowed: true,
      carry_forward_limit: 5,
      requires_medical_certificate: false,
      is_active: true
    });
    setShowAddForm(false);
  };

  const handleEdit = (policy: any) => {
    setFormData({
      leave_type: policy.leave_type,
      annual_limit: policy.annual_limit,
      min_days_notice: policy.min_days_notice,
      max_consecutive_days: policy.max_consecutive_days,
      carry_forward_allowed: policy.carry_forward_allowed,
      carry_forward_limit: policy.carry_forward_limit || 0,
      requires_medical_certificate: policy.requires_medical_certificate || false,
      is_active: policy.is_active
    });
    setEditingPolicy(policy.id);
    setShowAddForm(true);
  };

  const leaveTypeOptions = [
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'paid', label: 'Paid Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Policy Management</h1>
            <p className="text-gray-600">Configure leave policies and limits</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Policy
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                value={formData.leave_type}
                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as LeaveType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                {leaveTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Limit (Days) *
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.annual_limit}
                onChange={(e) => setFormData({ ...formData, annual_limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Days Notice *
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.min_days_notice}
                onChange={(e) => setFormData({ ...formData, min_days_notice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Consecutive Days *
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.max_consecutive_days}
                onChange={(e) => setFormData({ ...formData, max_consecutive_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="carry_forward"
                checked={formData.carry_forward_allowed}
                onChange={(e) => setFormData({ ...formData, carry_forward_allowed: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="carry_forward" className="ml-2 text-sm text-gray-700">
                Allow Carry Forward
              </label>
            </div>

            {formData.carry_forward_allowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carry Forward Limit (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.carry_forward_limit}
                  onChange={(e) => setFormData({ ...formData, carry_forward_limit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="medical_certificate"
                checked={formData.requires_medical_certificate}
                onChange={(e) => setFormData({ ...formData, requires_medical_certificate: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="medical_certificate" className="ml-2 text-sm text-gray-700">
                Requires Medical Certificate
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active Policy
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                {editingPolicy ? 'Update Policy' : 'Add Policy'}
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

      {/* Policies List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {leavePolicies.map((policy) => (
          <div key={policy.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {policy.leave_type} Leave
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    policy.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(policy)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Annual Limit:</span>
                  <span className="ml-2 font-medium text-gray-900">{policy.annual_limit} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Min Notice:</span>
                  <span className="ml-2 font-medium text-gray-900">{policy.min_days_notice} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Max Consecutive:</span>
                  <span className="ml-2 font-medium text-gray-900">{policy.max_consecutive_days} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Carry Forward:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {policy.carry_forward_allowed ? `${policy.carry_forward_limit || 0} days` : 'No'}
                  </span>
                </div>
              </div>

              {policy.requires_medical_certificate && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Requires medical certificate</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {leavePolicies.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Policies</h3>
          <p className="text-gray-600 mb-4">Create your first leave policy to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Policy
          </button>
        </div>
      )}
    </div>
  );
};

export default LeavePolicyManagement;