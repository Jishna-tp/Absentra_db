import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { User, Mail, Car as IdCard, Calendar, Building2, Users, Edit, Save, X } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { getEmployeeByUserId, departments } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const employee = user ? getEmployeeByUserId(user.id) : null;
  const department = employee ? departments.find(d => d.id === employee.department_id) : null;

  const handleSave = async () => {
    const newErrors: string[] = [];
    
    // Validation
    if (!formData.username.trim()) {
      newErrors.push('Username is required');
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.push('Password must be at least 6 characters long');
    }
    
    setErrors(newErrors);
    
    if (newErrors.length === 0) {
      setIsLoading(true);
      
      try {
        const updates: { username?: string; password?: string } = {};
        
        if (formData.username !== user?.username) {
          updates.username = formData.username;
        }
        
        if (formData.password) {
          updates.password = formData.password;
        }
        
        const success = await updateProfile(updates);
        
        if (success) {
          let message = 'Profile updated successfully!';
          if (formData.password) {
            message += ' Your new password will be used for future logins.';
          }
          setSuccessMessage(message);
          setIsEditing(false);
          setFormData({ ...formData, password: '', confirmPassword: '' });
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(''), 5000);
        } else {
          setErrors(['Failed to update profile. Please try again.']);
        }
      } catch (error) {
        setErrors(['An error occurred while updating your profile.']);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      password: '',
      confirmPassword: ''
    });
    setErrors([]);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and account settings</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <ul className="text-red-800 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-16 left-6">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          
          <div className="pt-12">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{employee?.name || user?.username}</h2>
                <p className="text-gray-600">{employee?.position || 'Employee'}</p>
                <p className="text-sm text-gray-500 mt-1">{department?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-semibold text-gray-900">{employee?.employee_id || user?.employee_id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            Personal Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-2">
              <IdCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium text-gray-900">{employee?.employee_id || user?.employee_id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 py-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium text-gray-900">{employee?.email || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 py-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{department?.name || 'Not assigned'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 py-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Joining Date</p>
                <p className="font-medium text-gray-900">
                  {employee?.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Work Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Work Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-2">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-medium text-gray-900">{employee?.position || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 py-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{department?.name || 'Not assigned'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 py-2">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Manager</p>
                <p className="font-medium text-gray-900">Not assigned</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 py-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                  {employee?.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Account Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
        
        <div className="space-y-6">
          {/* Username */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Username</p>
              <p className="text-sm text-gray-600">Your login username</p>
            </div>
            <div className="flex-1 max-w-md">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                />
              ) : (
                <p className="text-gray-900 font-medium">{user?.username}</p>
              )}
            </div>
          </div>
          
          {/* Password */}
          <div className="flex items-start justify-between py-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Leave blank to keep current password' : 'Last changed 30 days ago'}
              </p>
            </div>
            <div className="flex-1 max-w-md space-y-3">
              {isEditing ? (
                <>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="New password (optional)"
                  />
                  {formData.password && (
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  )}
                </>
              ) : (
                <p className="text-gray-900">••••••••</p>
              )}
            </div>
          </div>
          
          {/* Account Role */}
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Account Role</p>
              <p className="text-sm text-gray-500">Contact admin to change</p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                  {user?.role?.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">(Read-only)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;