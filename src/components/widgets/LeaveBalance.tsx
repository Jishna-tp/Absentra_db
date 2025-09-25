import React from 'react';
import { LeaveBalance as LeaveBalanceType } from '../../types';

interface LeaveBalanceProps {
  balances: LeaveBalanceType[];
}

const LeaveBalance: React.FC<LeaveBalanceProps> = ({ balances }) => {
  const leaveTypeColors = {
    casual: 'bg-blue-500',
    sick: 'bg-red-500',
    paid: 'bg-green-500',
    personal: 'bg-purple-500',
    maternity: 'bg-pink-500',
    paternity: 'bg-indigo-500'
  };

  if (balances.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No leave balance information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {balances.map((balance) => {
        const usedPercentage = (balance.used_days / balance.total_days) * 100;
        const remainingPercentage = (balance.remaining_days / balance.total_days) * 100;
        
        return (
          <div key={balance.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 capitalize">{balance.leave_type} Leave</h4>
              <span className="text-sm text-gray-600">{balance.year}</span>
            </div>
            
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-600">Used: {balance.used_days}</span>
              <span className="text-gray-600">Remaining: {balance.remaining_days}</span>
              <span className="text-gray-600">Total: {balance.total_days}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="flex h-full rounded-full overflow-hidden">
                <div
                  className={`${leaveTypeColors[balance.leave_type]} h-full`}
                  style={{ width: `${usedPercentage}%` }}
                ></div>
                <div
                  className="bg-gray-300 h-full"
                  style={{ width: `${remainingPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${leaveTypeColors[balance.leave_type]}`}></div>
                <span>Used ({usedPercentage.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span>Remaining ({remainingPercentage.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaveBalance;