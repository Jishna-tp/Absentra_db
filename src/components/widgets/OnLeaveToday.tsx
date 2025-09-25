import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Calendar, Building2 } from 'lucide-react';

interface OnLeaveTodayProps {
  teamOnly?: boolean;
  managerId?: string;
  showByDepartment?: boolean;
}

const OnLeaveToday: React.FC<OnLeaveTodayProps> = ({ 
  teamOnly = false, 
  managerId,
  showByDepartment = false 
}) => {
  const { employees, leaveRequests, departments } = useData();
  
  const today = new Date().toDateString();
  
  // Get approved leave requests for today
  const todayLeaves = leaveRequests.filter(request => {
    if (request.status !== 'approved') return false;
    
    const fromDate = new Date(request.from_date);
    const toDate = new Date(request.to_date);
    const todayDate = new Date();
    
    return todayDate >= fromDate && todayDate <= toDate;
  });

  // Filter employees based on props
  let relevantEmployees = employees;
  if (teamOnly && managerId) {
    relevantEmployees = employees.filter(emp => emp.manager_id === managerId);
  }

  // Get employees on leave today
  const employeesOnLeave = todayLeaves
    .map(request => ({
      employee: relevantEmployees.find(emp => emp.id === request.employee_id),
      request
    }))
    .filter(item => item.employee);

  if (employeesOnLeave.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No one is on leave today</p>
      </div>
    );
  }

  if (showByDepartment) {
    // Group by department
    const departmentGroups = departments.map(dept => ({
      department: dept,
      employees: employeesOnLeave.filter(item => 
        item.employee?.department_id === dept.id
      )
    })).filter(group => group.employees.length > 0);

    return (
      <div className="space-y-4">
        {departmentGroups.map(group => (
          <div key={group.department.id}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">{group.department.name}</h4>
              <span className="text-sm text-gray-500">({group.employees.length})</span>
            </div>
            <div className="space-y-2 ml-6">
              {group.employees.map(({ employee, request }) => (
                <div key={employee!.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{employee!.name}</p>
                    <p className="text-sm text-gray-600">{employee!.position}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="capitalize text-blue-600 font-medium">
                      {request!.leave_type}
                    </span>
                    <p className="text-gray-500">
                      {new Date(request!.from_date).toLocaleDateString()} - {new Date(request!.to_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {employeesOnLeave.map(({ employee, request }) => (
        <div key={employee!.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {employee!.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{employee!.name}</p>
              <p className="text-sm text-gray-600">{employee!.position}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <span className="capitalize text-blue-600 font-medium">
              {request!.leave_type}
            </span>
            <p className="text-gray-500">
              {request!.days_count} {request!.days_count === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OnLeaveToday;