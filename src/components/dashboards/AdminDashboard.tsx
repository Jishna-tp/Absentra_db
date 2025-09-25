import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Users, Building2, TrendingUp, Shield, Calendar, Settings, X, FileText } from 'lucide-react';
import StatsCard from '../ui/StatsCard';

const AdminDashboard: React.FC = () => {
  const { employees, departments, leaveRequests, holidays } = useData();
  const navigate = useNavigate();
  const [showHolidaysModal, setShowHolidaysModal] = React.useState(false);
  
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalDepartments = departments.length;
  const upcomingHolidays = holidays.filter(h => new Date(h.date) > new Date()).length;

  // Calculate system-wide statistics
  const totalLeaveRequests = leaveRequests.length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
  const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected').length;
  const approvalRate = totalLeaveRequests > 0 ? ((approvedRequests / totalLeaveRequests) * 100).toFixed(1) : '0';

  // Get upcoming holidays for modal
  const upcomingHolidaysList = holidays
    .filter(h => new Date(h.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleEmployeeCardClick = () => {
    navigate('/dashboard/employees');
  };

  const handleDepartmentCardClick = () => {
    navigate('/dashboard/departments');
  };

  const handleHolidaysCardClick = () => {
    setShowHolidaysModal(true);
  };

  return (
    <>
      <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Absentra Administration</h2>
            <p className="text-blue-100">Manage your Absentra system</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={handleEmployeeCardClick} className="cursor-pointer">
          <StatsCard
            title="Active Employees"
            value={activeEmployees}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="blue"
          />
        </div>
        <div onClick={handleDepartmentCardClick} className="cursor-pointer">
          <StatsCard
            title="Departments"
            value={totalDepartments}
            icon={<Building2 className="w-6 h-6 text-green-600" />}
            color="green"
          />
        </div>
        <div onClick={handleHolidaysCardClick} className="cursor-pointer">
          <StatsCard
            title="Upcoming Holidays"
            value={upcomingHolidays}
            icon={<Calendar className="w-6 h-6 text-purple-600" />}
            color="purple"
          />
        </div>
      </div>

      {/* System Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Request Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Leave Request Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-semibold text-gray-900">{totalLeaveRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{approvedRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-orange-600">{pendingRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rejected</span>
              <span className="font-semibold text-red-600">{rejectedRequests}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-gray-600">Approval Rate</span>
              <span className="font-semibold text-blue-600">{approvalRate}%</span>
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {departments.map((dept) => {
              const deptEmployees = employees.filter(emp => emp.department_id === dept.id && emp.status === 'active');
              const percentage = activeEmployees > 0 ? ((deptEmployees.length / activeEmployees) * 100).toFixed(1) : '0';
              
              return (
                <div key={dept.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-600">{deptEmployees.length} employees</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{percentage}%</p>
                    <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent System Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'New employee added', details: 'Emily Davis joined Engineering', time: '2 hours ago', type: 'user' },
            { action: 'Leave request approved', details: 'John Smith - Casual Leave', time: '4 hours ago', type: 'approval' },
            { action: 'Holiday added', details: 'Christmas Day 2024', time: '1 day ago', type: 'holiday' },
            { action: 'Department created', details: 'Research & Development', time: '2 days ago', type: 'department' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                ${activity.type === 'user' ? 'bg-blue-100 text-blue-600' : ''}
                ${activity.type === 'approval' ? 'bg-green-100 text-green-600' : ''}
                ${activity.type === 'holiday' ? 'bg-purple-100 text-purple-600' : ''}
                ${activity.type === 'department' ? 'bg-orange-100 text-orange-600' : ''}
              `}>
                {activity.type === 'user' && <Users className="w-4 h-4" />}
                {activity.type === 'approval' && <FileText className="w-4 h-4" />}
                {activity.type === 'holiday' && <Calendar className="w-4 h-4" />}
                {activity.type === 'department' && <Building2 className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.details}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

      {/* Upcoming Holidays Modal */}
      {showHolidaysModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upcoming Holidays</h2>
                <p className="text-gray-600 text-sm mt-1">
                  {upcomingHolidaysList.length} upcoming holidays
                </p>
              </div>
              <button
                onClick={() => setShowHolidaysModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {upcomingHolidaysList.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Holidays</h3>
                  <p className="text-gray-600">There are no holidays scheduled for the future.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingHolidaysList.map((holiday) => {
                    const date = new Date(holiday.date);
                    const today = new Date();
                    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={holiday.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{holiday.name}</h3>
                            <p className="text-sm text-gray-600">
                              {date.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            {holiday.description && (
                              <p className="text-sm text-gray-500 mt-1">{holiday.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-600">
                            {daysUntil === 1 ? 'Tomorrow' : 
                             daysUntil === 0 ? 'Today' : 
                             `${daysUntil} days`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {date.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/dashboard/holidays')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Manage Holidays
              </button>
              <button
                onClick={() => setShowHolidaysModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;