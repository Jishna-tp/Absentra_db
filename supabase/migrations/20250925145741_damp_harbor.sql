/*
  # Create useful views for the application

  1. Views
    - Employee details view with department information
    - Leave request details view with employee and approval information
    - Leave balance summary view
    - Pending approvals view for managers

  2. Security
    - Views inherit RLS policies from underlying tables
*/

-- Employee details view with department information
CREATE OR REPLACE VIEW employee_details AS
SELECT 
  e.id,
  e.name,
  e.employee_id,
  e.position,
  e.joining_date,
  e.email,
  e.status,
  e.manager_id,
  manager.name as manager_name,
  d.id as department_id,
  d.name as department_name,
  d.description as department_description,
  e.created_at,
  e.updated_at
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employees manager ON e.manager_id = manager.id;

-- Leave request details view with employee and approval information
CREATE OR REPLACE VIEW leave_request_details AS
SELECT 
  lr.id,
  lr.employee_id,
  e.name as employee_name,
  e.employee_id as employee_code,
  e.position as employee_position,
  d.name as department_name,
  lr.leave_type,
  lr.from_date,
  lr.to_date,
  lr.days_count,
  lr.reason,
  lr.status,
  lr.created_at,
  lr.updated_at,
  -- Current approval step information
  current_step.approver_role as current_approver_role,
  current_step.approver_id as current_approver_id,
  current_approver.name as current_approver_name,
  -- Approval progress
  (SELECT COUNT(*) FROM approval_steps WHERE leave_request_id = lr.id AND status = 'approved') as approved_steps,
  (SELECT COUNT(*) FROM approval_steps WHERE leave_request_id = lr.id) as total_steps
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN approval_steps current_step ON lr.id = current_step.leave_request_id AND current_step.is_current = true
LEFT JOIN employees current_approver ON current_step.approver_id = current_approver.id;

-- Leave balance summary view
CREATE OR REPLACE VIEW leave_balance_summary AS
SELECT 
  lb.employee_id,
  e.name as employee_name,
  e.employee_id as employee_code,
  lb.year,
  lb.leave_type,
  lb.total_days,
  lb.used_days,
  lb.remaining_days,
  lb.carried_forward_days,
  lp.annual_limit as policy_limit,
  lp.carry_forward_allowed,
  lp.carry_forward_limit as policy_carry_forward_limit
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
LEFT JOIN leave_policies lp ON lb.leave_type = lp.leave_type AND lp.is_active = true;

-- Pending approvals view for managers and HR
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
  lr.id as request_id,
  lr.employee_id,
  e.name as employee_name,
  e.employee_id as employee_code,
  e.position as employee_position,
  d.name as department_name,
  lr.leave_type,
  lr.from_date,
  lr.to_date,
  lr.days_count,
  lr.reason,
  lr.created_at as request_date,
  as_step.id as approval_step_id,
  as_step.step_order,
  as_step.approver_role,
  as_step.approver_id,
  approver.name as approver_name,
  -- Days until leave starts
  (lr.from_date - CURRENT_DATE) as days_until_leave
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
JOIN approval_steps as_step ON lr.id = as_step.leave_request_id
LEFT JOIN employees approver ON as_step.approver_id = approver.id
WHERE lr.status = 'pending' 
AND as_step.is_current = true
AND as_step.status = 'pending';

-- Team leave calendar view
CREATE OR REPLACE VIEW team_leave_calendar AS
SELECT 
  lr.id as request_id,
  lr.employee_id,
  e.name as employee_name,
  e.employee_id as employee_code,
  e.position as employee_position,
  e.manager_id,
  manager.name as manager_name,
  d.name as department_name,
  lr.leave_type,
  lr.from_date,
  lr.to_date,
  lr.days_count,
  lr.status,
  -- Generate series of dates for each leave request
  generate_series(lr.from_date, lr.to_date, '1 day'::interval)::date as leave_date
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
LEFT JOIN employees manager ON e.manager_id = manager.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE lr.status = 'approved';

-- Department statistics view
CREATE OR REPLACE VIEW department_statistics AS
SELECT 
  d.id as department_id,
  d.name as department_name,
  COUNT(DISTINCT e.id) as total_employees,
  COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_employees,
  COUNT(DISTINCT lr.id) as total_leave_requests,
  COUNT(DISTINCT CASE WHEN lr.status = 'approved' THEN lr.id END) as approved_requests,
  COUNT(DISTINCT CASE WHEN lr.status = 'pending' THEN lr.id END) as pending_requests,
  COUNT(DISTINCT CASE WHEN lr.status = 'rejected' THEN lr.id END) as rejected_requests,
  COALESCE(SUM(CASE WHEN lr.status = 'approved' THEN lr.days_count END), 0) as total_approved_days,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) > 0 
      THEN COALESCE(SUM(CASE WHEN lr.status = 'approved' THEN lr.days_count END), 0)::numeric / 
           COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END)
      ELSE 0 
    END, 2
  ) as avg_days_per_employee
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
LEFT JOIN leave_requests lr ON e.id = lr.employee_id
GROUP BY d.id, d.name;