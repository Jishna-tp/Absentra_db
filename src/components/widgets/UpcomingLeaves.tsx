import React from 'react';
import { LeaveRequest } from '../../types';
import { Calendar, Clock } from 'lucide-react';

interface UpcomingLeavesProps {
  requests: LeaveRequest[];
}

const UpcomingLeaves: React.FC<UpcomingLeavesProps> = ({ requests }) => {
  const today = new Date();
  
  // Filter for future approved leaves
  const upcomingLeaves = requests
    .filter(request => new Date(request.from_date) > today)
    .sort((a, b) => new Date(a.from_date).getTime() - new Date(b.from_date).getTime())
    .slice(0, 5);

  if (upcomingLeaves.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No upcoming leaves</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcomingLeaves.map((request) => (
        <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 capitalize">{request.leave_type}</p>
              <p className="text-sm text-gray-600">
                {new Date(request.from_date).toLocaleDateString()} - {new Date(request.to_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">{request.days_count} days</p>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {Math.ceil((new Date(request.from_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days away
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingLeaves;