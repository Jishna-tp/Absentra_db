import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Clock, CheckCircle, XCircle, Users, FileText } from 'lucide-react';
import StatsCard from '../ui/StatsCard';
import OnLeaveToday from '../widgets/OnLeaveToday';
import PendingApprovals from '../widgets/PendingApprovals';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests, employees, getEmployeeByUserId } = useData();
  
  const manager = user ? getEmployeeByUserId(user.id) : null;
  const directReports = employees.filter(emp => emp.manager_id === manager?.id);
  const teamLeaveRequests = leaveRequests.filter(req => 
    directReports.some(emp => emp.id === req.employee_id)
  );
  
  const pendingRequests = teamLeaveRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = teamLeaveRequests.filter(req => req.status === 'approved').length;
  const rejectedRequests = teamLeaveRequests.filter(req => req.status === 'rejected').length;

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
          title="Rejected Requests"
          value={rejectedRequests}
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          color="red"
        />
        <StatsCard
          title="Team Members"
          value={directReports.length}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Pending Approvals
          </h3>
          <PendingApprovals requests={teamLeaveRequests.filter(req => req.status === 'pending')} />
        </div>

        {/* Team on Leave Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Team Members on Leave Today
          </h3>
          <OnLeaveToday teamOnly={true} managerId={manager?.id} />
        </div>
      </div>

      {/* Recent Team Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Team Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Leave Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Dates</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Days</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Requested</th>
              </tr>
            </thead>
            <tbody>
              {teamLeaveRequests.slice(0, 5).map((request) => {
                const employee = employees.find(emp => emp.id === request.employee_id);
                return (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{employee?.name}</div>
                      <div className="text-sm text-gray-600">{employee?.employee_id}</div>
                    </td>
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

export default ManagerDashboard;