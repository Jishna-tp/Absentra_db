import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Calendar, Clock, FileText, Users, TrendingUp } from 'lucide-react';
import StatsCard from '../ui/StatsCard';
import OnLeaveToday from '../widgets/OnLeaveToday';
import UpcomingLeaves from '../widgets/UpcomingLeaves';
import LeaveBalance from '../widgets/LeaveBalance';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests, holidays, leaveBalances, getEmployeeByUserId } = useData();
  
  const employee = user ? getEmployeeByUserId(user.id) : null;
  const userLeaveRequests = leaveRequests.filter(req => req.employee_id === employee?.id);
  const userLeaveBalances = leaveBalances.filter(bal => bal.employee_id === employee?.id);
  
  const pendingRequests = userLeaveRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = userLeaveRequests.filter(req => req.status === 'approved').length;
  const totalUsedDays = userLeaveBalances.reduce((total, bal) => total + bal.used_days, 0);
  const totalRemainingDays = userLeaveBalances.reduce((total, bal) => total + bal.remaining_days, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pending Requests"
          value={pendingRequests}
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          color="orange"
        />
        <StatsCard
          title="Approved Leaves"
          value={approvedRequests}
          icon={<FileText className="w-6 h-6 text-green-600" />}
          color="green"
        />
        <StatsCard
          title="Days Used"
          value={totalUsedDays}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <StatsCard
          title="Days Remaining"
          value={totalRemainingDays}
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
          <LeaveBalance balances={userLeaveBalances} />
        </div>

        {/* On Leave Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            Team Members on Leave Today
          </h3>
          <OnLeaveToday />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Leaves */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Leaves</h3>
          <UpcomingLeaves requests={userLeaveRequests.filter(req => req.status === 'approved')} />
        </div>

        {/* Company Holidays */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Holidays</h3>
          <div className="space-y-3">
            {holidays.slice(0, 5).map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{holiday.name}</p>
                  {holiday.description && (
                    <p className="text-sm text-gray-600">{holiday.description}</p>
                  )}
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  {new Date(holiday.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;