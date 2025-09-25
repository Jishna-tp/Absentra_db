import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Clock, CheckCircle, XCircle, Users, Building2, TrendingUp, BarChart3 } from 'lucide-react';
import StatsCard from '../ui/StatsCard';
import OnLeaveToday from '../widgets/OnLeaveToday';
import PendingApprovals from '../widgets/PendingApprovals';

const HRDashboard: React.FC = () => {
  const { leaveRequests, employees, departments } = useData();
  
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
  const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected').length;
  const totalEmployees = employees.filter(emp => emp.status === 'active').length;

  // Calculate leave statistics by department
  const departmentStats = departments.map(dept => {
    const deptEmployees = employees.filter(emp => emp.department_id === dept.id);
    const deptRequests = leaveRequests.filter(req => 
      deptEmployees.some(emp => emp.id === req.employee_id)
    );
    
    return {
      ...dept,
      employeeCount: deptEmployees.length,
      pendingRequests: deptRequests.filter(req => req.status === 'pending').length,
      approvedRequests: deptRequests.filter(req => req.status === 'approved').length
    };
  });

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pending Approvals"
          value={pendingRequests}
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          color="orange"
        />
        <StatsCard
          title="Approved Requests"
          value={approvedRequests}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="green"
        />
        <StatsCard
          title="Total Employees"
          value={totalEmployees}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <StatsCard
          title="Departments"
          value={departments.length}
          icon={<Building2 className="w-6 h-6 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Pending Approvals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            All Pending Approvals
            </h3>
            <Link 
              to="/dashboard/reports"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
              View Reports
            </Link>
          </div>
          <PendingApprovals requests={leaveRequests.filter(req => req.status === 'pending')} showAll={true} />
        </div>

        {/* Company-wide on Leave Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Employees on Leave Today
          </h3>
          <OnLeaveToday showByDepartment={true} />
        </div>
      </div>

      {/* Department Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          Department Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentStats.map((dept) => (
            <div key={dept.id} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{dept.name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Employees:</span>
                  <span className="font-medium text-gray-900">{dept.employeeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-orange-600">{dept.pendingRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved:</span>
                  <span className="font-medium text-green-600">{dept.approvedRequests}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leave Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Leave Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Dates</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Days</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Requested</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.slice(0, 10).map((request) => {
                const employee = employees.find(emp => emp.id === request.employee_id);
                const department = departments.find(dept => dept.id === employee?.department_id);
                return (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{employee?.name}</div>
                      <div className="text-sm text-gray-600">{employee?.employee_id}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{department?.name}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-gray-900">{request.leave_type}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(request.from_date).toLocaleDateString()} - {new Date(request.to_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{request.days_count}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                        ${request.status === 'pending' ? 'bg-orange-100 text-orange-800' : ''}
                        ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(request.created_at).toLocaleDateString()}
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

export default HRDashboard;