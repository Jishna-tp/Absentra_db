import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { LeaveRequest } from '../../types';
import { CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';

interface PendingApprovalsProps {
  requests: LeaveRequest[];
  showAll?: boolean;
}

const PendingApprovals: React.FC<PendingApprovalsProps> = ({ requests, showAll = false }) => {
  const { user } = useAuth();
  const { employees, approveLeaveRequest, rejectLeaveRequest, getEmployeeByUserId } = useData();
  
  const currentEmployee = user ? getEmployeeByUserId(user.id) : null;

  const handleApprove = (requestId: string, comments?: string) => {
    if (!currentEmployee) return;
    approveLeaveRequest(requestId, currentEmployee.id, comments);
  };

  const handleReject = (requestId: string, comments?: string) => {
    if (!currentEmployee) return;
    rejectLeaveRequest(requestId, currentEmployee.id, comments);
  };

  // Filter requests that need current user's approval
  const relevantRequests = requests.filter(request => {
    const currentApproval = request.approvals?.find(a => a.is_current);
    return currentApproval && 
           ((user?.role === 'line_manager' && currentApproval.approver_role === 'line_manager') ||
            (user?.role === 'hr' && currentApproval.approver_role === 'hr') ||
            (user?.role === 'admin'));
  });
  if (relevantRequests.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No pending approvals</p>
      </div>
    );
  }

  const displayRequests = showAll ? relevantRequests : relevantRequests.slice(0, 5);

  return (
    <div className="space-y-3">
      {displayRequests.map((request) => {
        const employee = employees.find(emp => emp.id === request.employee_id);
        const currentApproval = request.approvals?.find(a => a.is_current);
        
        return (
          <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{employee?.name}</h4>
                <p className="text-sm text-gray-600">{employee?.employee_id}</p>
                <p className="text-sm text-gray-600 capitalize mt-1">
                  {request.leave_type} leave
                </p>
                {currentApproval && (
                  <p className="text-xs text-blue-600 mt-1">
                    Awaiting {currentApproval.approver_role.replace('_', ' ')} approval
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{request.days_count} days</p>
                <p className="text-xs text-gray-500">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(request.from_date).toLocaleDateString()} - {new Date(request.to_date).toLocaleDateString()}
              </span>
            </div>
            
            {request.reason && (
              <p className="text-sm text-gray-700 mb-3 bg-white p-2 rounded border">
                <strong>Reason:</strong> {request.reason}
              </p>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        );
      })}
      
      {!showAll && relevantRequests.length > 5 && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            Showing 5 of {relevantRequests.length} pending requests
          </p>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;