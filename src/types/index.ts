export type UserRole = 'employee' | 'line_manager' | 'hr' | 'admin';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType = 'casual' | 'sick' | 'paid' | 'personal' | 'maternity' | 'paternity';

export interface User {
  id: string;
  username: string;
  email?: string;
  employee_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Employee {
  id: string;
  name: string;
  employee_id: string;
  department_id: string;
  position: string;
  manager_id?: string;
  joining_date: string;
  status: 'active' | 'inactive';
  email?: string;
  created_at: string;
  updated_at: string;
  department?: Department;
  manager?: Employee;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  reason: string;
  status: LeaveStatus;
  approvals: ApprovalStep[];
  created_at: string;
  updated_at: string;
  employee?: Employee;
  days_count: number;
}

export interface ApprovalStep {
  id: string;
  step_order: number;
  approver_role: UserRole;
  approver_id?: string;
  status: LeaveStatus;
  comments?: string;
  approved_at?: string;
  is_current: boolean;
}

export interface NotificationMetadata {
  employeeId?: string;
  employeeName?: string;
  batchNumber?: string;
  leaveType?: string;
  leaveDates?: string;
  approverName?: string;
  requestId?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
  employee?: Employee;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  order: number;
  role: UserRole;
  required: boolean;
}

export interface LeavePolicy {
  id: string;
  leave_type: LeaveType;
  annual_limit: number;
  min_days_notice: number;
  max_consecutive_days: number;
  carry_forward_allowed: boolean;
  carry_forward_limit?: number;
  requires_medical_certificate?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}