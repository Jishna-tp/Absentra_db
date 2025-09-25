import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Department, LeaveRequest, Holiday, LeaveBalance, LeaveType, ApprovalStep, UserRole, LeavePolicy, User } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  employees: Employee[];
  departments: Department[];
  users: User[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  leaveBalances: LeaveBalance[];
  leavePolicies: LeavePolicy[];
  loading: boolean;
  addEmployee: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  addUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  resetUserPassword: (id: string) => string;
  addDepartment: (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => void;
  updateDepartment: (id: string, department: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  submitLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'days_count'>) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  approveLeaveRequest: (id: string, approverId: string, comments?: string) => void;
  rejectLeaveRequest: (id: string, approverId: string, comments?: string) => void;
  addHoliday: (holiday: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>) => void;
  updateHoliday: (id: string, holiday: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;
  addLeavePolicy: (policy: Omit<LeavePolicy, 'id' | 'created_at' | 'updated_at'>) => void;
  updateLeavePolicy: (id: string, policy: Partial<LeavePolicy>) => void;
  validateLeaveRequest: (request: { employee_id: string; leave_type: LeaveType; from_date: string; to_date: string; days_count: number }) => { isValid: boolean; errors: string[] };
  getEmployeeByUserId: (userId: string) => Employee | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextEmployeeId, setNextEmployeeId] = useState<number>(1);
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  useEffect(() => {
    // Initialize with mock data
    const mockDepartments: Department[] = [
      { id: '1', name: 'Engineering', description: 'Software Development', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'Human Resources', description: 'HR Management', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', name: 'Marketing', description: 'Marketing and Sales', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    const mockEmployees: Employee[] = [
      { id: '1', name: 'Admin User', employee_id: 'EMP001', department_id: '2', position: 'System Admin', joining_date: '2024-01-01', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'Sarah Johnson', employee_id: 'EMP002', department_id: '2', position: 'HR Manager', joining_date: '2024-01-15', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', name: 'Mike Chen', employee_id: 'EMP003', department_id: '1', position: 'Team Lead', joining_date: '2024-02-01', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '4', name: 'Emily Davis', employee_id: 'EMP004', department_id: '1', position: 'Software Developer', manager_id: '3', joining_date: '2024-02-15', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    const mockUsers: User[] = [
      { id: '1', username: 'admin', email: 'admin@company.com', employee_id: 'EMP001', role: 'admin', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', last_login: '2024-12-20T10:30:00Z' },
      { id: '2', username: 'hr.manager', email: 'hr@company.com', employee_id: 'EMP002', role: 'hr', is_active: true, created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z', last_login: '2024-12-19T10:30:00Z' },
      { id: '3', username: 'line.manager', email: 'manager@company.com', employee_id: 'EMP003', role: 'line_manager', is_active: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z', last_login: '2024-12-18T10:30:00Z' },
      { id: '4', username: 'employee', email: 'employee@company.com', employee_id: 'EMP004', role: 'employee', is_active: true, created_at: '2024-02-15T00:00:00Z', updated_at: '2024-02-15T00:00:00Z', last_login: '2024-12-17T10:30:00Z' },
    ];

    const mockHolidays: Holiday[] = [
      { id: '1', name: 'New Year\'s Day', date: '2024-01-01', description: 'Public Holiday', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', name: 'Independence Day', date: '2024-07-04', description: 'National Holiday', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', name: 'Christmas Day', date: '2024-12-25', description: 'Religious Holiday', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    const mockLeaveRequests: LeaveRequest[] = [
      {
        id: '1',
        employee_id: '4',
        leave_type: 'casual',
        from_date: '2024-12-20',
        to_date: '2024-12-22',
        reason: 'Family vacation',
        status: 'pending',
        approvals: [
          {
            id: '1',
            step_order: 1,
            approver_role: 'line_manager',
            status: 'pending',
            is_current: true
          },
          {
            id: '2',
            step_order: 2,
            approver_role: 'hr',
            status: 'pending',
            is_current: false
          }
        ],
        days_count: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const mockLeaveBalances: LeaveBalance[] = [
      { id: '1', employee_id: '4', leave_type: 'casual', total_days: 12, used_days: 2, remaining_days: 10, year: 2024 },
      { id: '2', employee_id: '4', leave_type: 'sick', total_days: 10, used_days: 1, remaining_days: 9, year: 2024 },
      { id: '3', employee_id: '4', leave_type: 'paid', total_days: 20, used_days: 5, remaining_days: 15, year: 2024 },
    ];

    const mockLeavePolicies: LeavePolicy[] = [
      {
        id: '1',
        leave_type: 'casual',
        annual_limit: 12,
        min_days_notice: 2,
        max_consecutive_days: 5,
        carry_forward_allowed: true,
        carry_forward_limit: 5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        leave_type: 'sick',
        annual_limit: 10,
        min_days_notice: 0,
        max_consecutive_days: 10,
        carry_forward_allowed: false,
        requires_medical_certificate: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        leave_type: 'paid',
        annual_limit: 20,
        min_days_notice: 7,
        max_consecutive_days: 15,
        carry_forward_allowed: true,
        carry_forward_limit: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setDepartments(mockDepartments);
    setEmployees(mockEmployees);
    setUsers(mockUsers);
    setHolidays(mockHolidays);
    setLeaveRequests(mockLeaveRequests);
    setLeaveBalances(mockLeaveBalances);
    setLeavePolicies(mockLeavePolicies);
    setLoading(false);
    
    // Calculate next employee ID based on existing employees
    const maxId = getMaxEmployeeId(mockEmployees);
    setNextEmployeeId(maxId + 1);
  }, []);

  // Helper function to get maximum employee ID from current employees
  const getMaxEmployeeId = (employeeList: Employee[]): number => {
    if (employeeList.length === 0) return 0;
    
    const maxId = employeeList.reduce((max, emp) => {
      // Extract numeric part from employee ID (e.g., "EMP001" -> 1)
      const idMatch = emp.employee_id.match(/\d+/);
      const numericId = idMatch ? parseInt(idMatch[0], 10) : 0;
      return Math.max(max, numericId);
    }, 0);
    
    return maxId;
  };

  // Generate next employee ID with proper formatting
  const generateNextEmployeeId = async (): Promise<string> => {
    setIsGeneratingId(true);
    
    try {
      // Simulate database query delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Re-calculate max ID to handle race conditions
      const currentMaxId = getMaxEmployeeId(employees);
      const nextId = currentMaxId + 1;
      
      // Format as EMP001, EMP002, etc.
      const formattedId = `EMP${nextId.toString().padStart(3, '0')}`;
      
      // Update next ID counter
      setNextEmployeeId(nextId + 1);
      
      return formattedId;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      throw new Error('Failed to generate employee ID');
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Reserve an employee ID (for preventing race conditions)
  const reserveEmployeeId = async (): Promise<{ id: string; release: () => void }> => {
    const generatedId = await generateNextEmployeeId();
    
    // In a real database, this would create a temporary reservation
    // For now, we'll just return the ID and a no-op release function
    const release = () => {
      // In real implementation, this would release the reservation
      console.log(`Released reservation for ID: ${generatedId}`);
    };
    
    return { id: generatedId, release };
  };

  const addEmployee = (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    // Validate that employee_id is not already taken
    const existingEmployee = employees.find(emp => emp.employee_id === employee.employee_id);
    if (existingEmployee) {
      throw new Error(`Employee ID ${employee.employee_id} is already in use`);
    }
    
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEmployees(prev => [...prev, newEmployee]);
    
    // Update next employee ID counter
    const numericId = parseInt(employee.employee_id.match(/\d+/)?.[0] || '0', 10);
    if (numericId >= nextEmployeeId) {
      setNextEmployeeId(numericId + 1);
    }
  };

  const updateEmployee = (id: string, employee: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === id ? { ...emp, ...employee, updated_at: new Date().toISOString() } : emp
    ));
  };

  const addUser = (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, ...userData, updated_at: new Date().toISOString() } : u
    ));
  };

  const resetUserPassword = (id: string): string => {
    const tempPassword = 'TempPass' + Math.random().toString(36).substr(2, 6);
    updateUser(id, { updated_at: new Date().toISOString() });
    return tempPassword;
  };
  const addDepartment = (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
    const newDepartment: Department = {
      ...department,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setDepartments(prev => [...prev, newDepartment]);
  };

  const updateDepartment = (id: string, department: Partial<Department>) => {
    setDepartments(prev => prev.map(dept => 
      dept.id === id ? { ...dept, ...department, updated_at: new Date().toISOString() } : dept
    ));
  };

  const deleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(dept => dept.id !== id));
  };

  const submitLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'days_count'>) => {
    const fromDate = new Date(request.from_date);
    const toDate = new Date(request.to_date);
    const timeDiff = toDate.getTime() - fromDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Get current employee
    const currentEmployee = user ? getEmployeeByUserId(user.id) : undefined;

    // Validate against policies
    const validation = validateLeaveRequest({
      ...request,
      days_count: daysDiff
    });
    
    if (!validation.isValid) {
      setTimeout(() => {
        const event = new CustomEvent('showToast', {
          detail: {
            type: 'error',
            title: 'Leave Request Validation Failed',
            message: validation.errors.join('. ')
          }
        });
        window.dispatchEvent(event);
      }, 100);
      return;
    }
    
    // Create approval workflow based on user role
    let approvals: ApprovalStep[] = [];
    let requestStatus: 'pending' | 'approved' = 'pending';
    
    if (user?.role === 'hr') {
      // HR requests are auto-approved
      approvals = [
        {
          id: Date.now().toString() + '_1',
          step_order: 1,
          approver_role: 'hr',
          approver_id: currentEmployee?.id,
          status: 'approved',
          comments: 'Auto-approved for HR',
          approved_at: new Date().toISOString(),
          is_current: false
        }
      ];
      requestStatus = 'approved';
    } else if (user?.role === 'admin') {
      // Admin only needs HR approval
      approvals = [
        {
          id: Date.now().toString() + '_1',
          step_order: 1,
          approver_role: 'hr',
          status: 'pending',
          is_current: true
        }
      ];
    } else {
      // Regular employees need line manager then HR approval
      approvals = [
        {
          id: Date.now().toString() + '_1',
          step_order: 1,
          approver_role: 'line_manager',
          status: 'pending',
          is_current: true
        },
        {
          id: Date.now().toString() + '_2',
          step_order: 2,
          approver_role: 'hr',
          status: 'pending',
          is_current: false
        }
      ];
    }
    
    const newRequest: LeaveRequest = {
      ...request,
      id: Date.now().toString(),
      status: requestStatus,
      approvals: approvals,
      days_count: daysDiff,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLeaveRequests(prev => [...prev, newRequest]);
    
    // Trigger notification workflow
    setTimeout(() => {
      const event = new CustomEvent('leaveRequestSubmitted', {
        detail: {
          employee: currentEmployee,
          request: newRequest
        }
      });
      window.dispatchEvent(event);
    }, 100);

    // Show success notification
    setTimeout(() => {
      const event = new CustomEvent('showToast', {
        detail: {
          type: 'success',
          title: 'Leave Request Submitted',
          message: user?.role === 'hr' 
            ? `Your ${request.leave_type} leave request for ${daysDiff} days has been auto-approved.`
            : `Your ${request.leave_type} leave request for ${daysDiff} days has been submitted for approval.`
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  const updateLeaveRequest = (id: string, updates: Partial<LeaveRequest>) => {
    setLeaveRequests(prev => prev.map(req => 
      req.id === id ? { ...req, ...updates, updated_at: new Date().toISOString() } : req
    ));
  };

  const approveLeaveRequest = (id: string, approverId: string, comments?: string) => {
    let employeeName = '';
    let leaveType = '';
    let isFullyApproved = false;
    let requestData: LeaveRequest | undefined;
    let employeeData: Employee | undefined;
    let approverData: Employee | undefined;
    
    setLeaveRequests(prev => prev.map(req => {
      if (req.id !== id) return req;
      
      const employee = employees.find(emp => emp.id === req.employee_id);
      const approver = employees.find(emp => emp.id === approverId);
      employeeName = employee?.name || 'Employee';
      leaveType = req.leave_type;
      employeeData = employee;
      approverData = approver;
      
      const updatedApprovals = req.approvals.map(approval => {
        if (approval.is_current) {
          return {
            ...approval,
            approver_id: approverId,
            status: 'approved' as const,
            comments,
            approved_at: new Date().toISOString(),
            is_current: false
          };
        }
        return approval;
      });
      
      // Find next pending approval
      const currentStepOrder = updatedApprovals.find(a => a.approver_id === approverId)?.step_order || 0;
      const nextApproval = updatedApprovals.find(a => a.step_order === currentStepOrder + 1);
      
      if (nextApproval) {
        nextApproval.is_current = true;
      }
      
      // Determine overall status
      const allApproved = updatedApprovals.every(a => a.status === 'approved');
      const overallStatus = allApproved ? 'approved' : 'pending';
      isFullyApproved = allApproved;
      
      const updatedRequest = {
        ...req,
        approvals: updatedApprovals,
        status: overallStatus,
        updated_at: new Date().toISOString()
      };
      requestData = updatedRequest;

      return updatedRequest;
    }));
    
    // Trigger notification workflow
    setTimeout(() => {
      const event = new CustomEvent('leaveRequestApproved', {
        detail: {
          employee: employeeData,
          request: requestData,
          approver: approverData,
          isFullyApproved
        }
      });
      window.dispatchEvent(event);
    }, 100);
    
    // Show notification
    setTimeout(() => {
      const event = new CustomEvent('showToast', {
        detail: {
          type: 'success',
          title: isFullyApproved ? 'Leave Request Fully Approved' : 'Leave Request Approved',
          message: isFullyApproved 
            ? `${employeeName}'s ${leaveType} leave request has been fully approved.`
            : `${employeeName}'s ${leaveType} leave request has been approved and forwarded to the next approver.`
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  const rejectLeaveRequest = (id: string, approverId: string, comments?: string) => {
    let employeeName = '';
    let leaveType = '';
    let requestData: LeaveRequest | undefined;
    let employeeData: Employee | undefined;
    let approverData: Employee | undefined;
    
    setLeaveRequests(prev => prev.map(req => {
      if (req.id !== id) return req;
      
      const employee = employees.find(emp => emp.id === req.employee_id);
      const approver = employees.find(emp => emp.id === approverId);
      employeeName = employee?.name || 'Employee';
      leaveType = req.leave_type;
      employeeData = employee;
      approverData = approver;
      
      const updatedApprovals = req.approvals.map(approval => {
        if (approval.is_current) {
          return {
            ...approval,
            approver_id: approverId,
            status: 'rejected' as const,
            comments,
            approved_at: new Date().toISOString(),
            is_current: false
          };
        }
        return approval;
      });
      
      const updatedRequest = {
        ...req,
        approvals: updatedApprovals,
        status: 'rejected',
        updated_at: new Date().toISOString()
      };
      requestData = updatedRequest;

      return updatedRequest;
    }));
    
    // Trigger notification workflow
    setTimeout(() => {
      const event = new CustomEvent('leaveRequestRejected', {
        detail: {
          employee: employeeData,
          request: requestData,
          approver: approverData
        }
      });
      window.dispatchEvent(event);
    }, 100);
    
    // Show notification
    setTimeout(() => {
      const event = new CustomEvent('showToast', {
        detail: {
          type: 'error',
          title: 'Leave Request Rejected',
          message: `${employeeName}'s ${leaveType} leave request has been rejected.`
        }
      });
      window.dispatchEvent(event);
    }, 100);
  };
  const addHoliday = (holiday: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>) => {
    const newHoliday: Holiday = {
      ...holiday,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setHolidays(prev => [...prev, newHoliday]);
  };

  const updateHoliday = (id: string, holiday: Partial<Holiday>) => {
    setHolidays(prev => prev.map(h => 
      h.id === id ? { ...h, ...holiday, updated_at: new Date().toISOString() } : h
    ));
  };

  const deleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const addLeavePolicy = (policy: Omit<LeavePolicy, 'id' | 'created_at' | 'updated_at'>) => {
    const newPolicy: LeavePolicy = {
      ...policy,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLeavePolicies(prev => [...prev, newPolicy]);
  };

  const updateLeavePolicy = (id: string, policy: Partial<LeavePolicy>) => {
    setLeavePolicies(prev => prev.map(p => 
      p.id === id ? { ...p, ...policy, updated_at: new Date().toISOString() } : p
    ));
  };

  const validateLeaveRequest = (request: { employee_id: string; leave_type: LeaveType; from_date: string; to_date: string; days_count: number }) => {
    const errors: string[] = [];
    
    // Find applicable policy
    const policy = leavePolicies.find(p => p.leave_type === request.leave_type && p.is_active);
    if (!policy) {
      errors.push(`No active policy found for ${request.leave_type} leave`);
      return { isValid: false, errors };
    }
    
    // Check minimum notice period
    const requestDate = new Date();
    const fromDate = new Date(request.from_date);
    const daysDifference = Math.ceil((fromDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < policy.min_days_notice) {
      errors.push(`Minimum ${policy.min_days_notice} days notice required for ${request.leave_type} leave`);
    }
    
    // Check maximum consecutive days
    if (request.days_count > policy.max_consecutive_days) {
      errors.push(`Maximum ${policy.max_consecutive_days} consecutive days allowed for ${request.leave_type} leave`);
    }
    
    // Check annual limit
    const currentYear = new Date().getFullYear();
    const employeeBalance = leaveBalances.find(b => 
      b.employee_id === request.employee_id && 
      b.leave_type === request.leave_type && 
      b.year === currentYear
    );
    
    if (employeeBalance && request.days_count > employeeBalance.remaining_days) {
      errors.push(`Insufficient leave balance. Available: ${employeeBalance.remaining_days} days`);
    }
    
    return { isValid: errors.length === 0, errors };
  };
  const getEmployeeByUserId = (userId: string): Employee | undefined => {
    // Mock mapping - in real app, this would be based on proper user-employee relationship
    const userEmployeeMap: Record<string, string> = {
      '1': '1', // admin -> Admin User
      '2': '2', // hr.manager -> Sarah Johnson
      '3': '3', // line.manager -> Mike Chen
      '4': '4', // employee -> Emily Davis
    };
    
    const employeeId = userEmployeeMap[userId];
    return employees.find(emp => emp.id === employeeId);
  };

  return (
    <DataContext.Provider value={{
      employees,
      departments,
      users,
      leaveRequests,
      holidays,
      leaveBalances,
      leavePolicies,
      loading,
      addEmployee,
      updateEmployee,
      addUser,
      updateUser,
      resetUserPassword,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      submitLeaveRequest,
      updateLeaveRequest,
      approveLeaveRequest,
      rejectLeaveRequest,
      addHoliday,
      updateHoliday,
      deleteHoliday,
      addLeavePolicy,
      updateLeavePolicy,
      validateLeaveRequest,
      getEmployeeByUserId,
      generateNextEmployeeId,
      reserveEmployeeId,
      isGeneratingId
    }}>
      {children}
    </DataContext.Provider>
  );
};