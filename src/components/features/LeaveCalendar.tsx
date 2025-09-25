import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const LeaveCalendar: React.FC = () => {
  const { leaveRequests, holidays, employees, getEmployeeByUserId } = useData();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const employee = user ? getEmployeeByUserId(user.id) : null;

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isDateInRange = (date: Date, fromDate: string, toDate: string) => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return checkDate >= from && checkDate <= to;
  };

  const getDateEvents = (date: Date) => {
    const events = [];
    
    // Check holidays
    const holiday = holidays.find(h => {
      const holidayDate = new Date(h.date);
      return holidayDate.toDateString() === date.toDateString();
    });
    
    if (holiday) {
      events.push({
        type: 'holiday',
        title: holiday.name,
        color: 'bg-red-500'
      });
    }

    // Check approved leaves
    const approvedLeaves = leaveRequests.filter(request => 
      request.status === 'approved' && 
      isDateInRange(date, request.from_date, request.to_date)
    );

    approvedLeaves.forEach(request => {
      const emp = employees.find(e => e.id === request.employee_id);
      const isCurrentUser = employee?.id === request.employee_id;
      
      events.push({
        type: 'leave',
        title: isCurrentUser ? `My ${request.leave_type} leave` : `${emp?.name} - ${request.leave_type}`,
        color: isCurrentUser ? 'bg-blue-500' : 'bg-green-500'
      });
    });

    // Check pending leaves
    const pendingLeaves = leaveRequests.filter(request => 
      request.status === 'pending' && 
      request.employee_id === employee?.id &&
      isDateInRange(date, request.from_date, request.to_date)
    );

    pendingLeaves.forEach(request => {
      events.push({
        type: 'pending',
        title: `Pending ${request.leave_type}`,
        color: 'bg-orange-500'
      });
    });

    return events;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getDateEvents(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div key={day} className={`h-24 border border-gray-200 p-1 overflow-hidden ${isToday ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-white'}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {events.slice(0, 2).map((event, index) => (
              <div
                key={index}
                className={`text-xs px-1 py-0.5 rounded text-white truncate ${event.color}`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-gray-500">
                +{events.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Calendar</h1>
            <p className="text-gray-600">View leave schedules and holidays</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">My Leaves</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Team Leaves</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-700">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Holidays</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map(day => (
            <div key={day} className="py-3 px-4 text-sm font-medium text-gray-600 text-center">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events This Month</h3>
        <div className="space-y-3">
          {/* Upcoming holidays this month */}
          {holidays
            .filter(holiday => {
              const holidayDate = new Date(holiday.date);
              return holidayDate.getMonth() === currentDate.getMonth() && 
                     holidayDate.getFullYear() === currentDate.getFullYear() &&
                     holidayDate >= new Date();
            })
            .map(holiday => (
              <div key={holiday.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{holiday.name}</p>
                  <p className="text-sm text-gray-600">{new Date(holiday.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}

          {/* Upcoming approved leaves this month */}
          {leaveRequests
            .filter(request => {
              const fromDate = new Date(request.from_date);
              return request.status === 'approved' &&
                     request.employee_id === employee?.id &&
                     fromDate.getMonth() === currentDate.getMonth() && 
                     fromDate.getFullYear() === currentDate.getFullYear() &&
                     fromDate >= new Date();
            })
            .map(request => (
              <div key={request.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 capitalize">{request.leave_type} Leave</p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.from_date).toLocaleDateString()} - {new Date(request.to_date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm text-blue-600 font-medium">{request.days_count} days</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendar;