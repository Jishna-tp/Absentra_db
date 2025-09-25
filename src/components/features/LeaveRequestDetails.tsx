import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { LeaveRequest, ApprovalStep } from '../../types';
import { 
  Calendar, Clock, User, MessageSquare, CheckCircle, 
  XCircle, AlertCircle, ArrowRight, X 
} from 'lucide-react';

interface LeaveRequestDetailsProps {
  request: LeaveRequest;
  onClose: () => void;
}

const LeaveRequestDetails: React.FC<LeaveRequestDetailsProps> = ({ request, onClose }) => {
  const { employees } = useData();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');

  const employee = employees.find(emp => emp.id === request.employee_id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Leave Request Details</h2>
            <p className="text-gray-600 text-sm mt-1">Request ID: {request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Request Information */}
        <div className="p-6 space-y-6">
          {/* Employee Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              Employee Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{employee?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium text-gray-900">{employee?.employee_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-medium text-gray-900">{employee?.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Request Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Leave Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Leave Type</p>
                <p className="font-medium text-gray-900 capitalize">{request.leave_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium text-gray-900">{request.days_count} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">From Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(request.from_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">To Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(request.to_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {request.reason && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Reason</p>
                <p className="text-gray-900 bg-white p-3 rounded border">
                  {request.reason}
                </p>
              </div>
            )}
          </div>

          {/* Overall Status */}
          <div className="flex items-center justify-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(request.status)}`}>
              {getStatusIcon(request.status)}
              <span className="font-medium capitalize">{request.status}</span>
            </div>
          </div>

          {/* Approval Workflow */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              Approval Workflow
            </h3>
            
            <div className="space-y-4">
              {request.approvals?.map((approval, index) => {
                const approver = approval.approver_id ? 
                  employees.find(emp => emp.id === approval.approver_id) : null;
                
                return (
                  <div key={approval.id} className="relative">
                    {/* Connection Line */}
                    {index < request.approvals.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300"></div>
                    )}
                    
                    <div className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
                      approval.is_current ? 'border-blue-200 bg-blue-50' : 
                      approval.status === 'approved' ? 'border-green-200 bg-green-50' :
                      approval.status === 'rejected' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex-shrink-0">
                        {getStatusIcon(approval.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {getRoleDisplayName(approval.approver_role)}
                            {approval.is_current && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Current Step
                              </span>
                            )}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(approval.status)}`}>
                            {approval.status}
                          </span>
                        </div>
                        
                        {approver && (
                          <p className="text-sm text-gray-600 mb-1">
                            {approver.name} ({approver.employee_id})
                          </p>
                        )}
                        
                        {approval.approved_at && (
                          <p className="text-xs text-gray-500 mb-2">
                            {approval.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                            {new Date(approval.approved_at).toLocaleString()}
                          </p>
                        )}
                        
                        {approval.comments && (
                          <div className="bg-white p-3 rounded border mt-2">
                            <p className="text-sm text-gray-700">{approval.comments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Request Submitted:</span>
                <span className="text-gray-900">
                  {new Date(request.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900">
                  {new Date(request.updated_at).toLocaleString()}
                </span>
              </div>
              {request.status === 'approved' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Approval:</span>
                  <span className="text-green-600 font-medium">
                    {new Date(request.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestDetails;