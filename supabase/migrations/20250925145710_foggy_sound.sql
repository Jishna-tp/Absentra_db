/*
  # Create helper functions for the application

  1. Helper Functions
    - Function to get employee by user ID
    - Function to check if user can approve leave request
    - Function to get next employee ID
    - Function to update leave balances after approval
    - Function to create default approval workflow

  2. Security
    - Functions are created with appropriate security context
*/

-- Function to get employee by user ID
CREATE OR REPLACE FUNCTION get_employee_by_user_id(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  name text,
  employee_id text,
  department_id uuid,
  position text,
  manager_id uuid,
  joining_date date,
  email text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, e.employee_id, e.department_id, e.position, 
         e.manager_id, e.joining_date, e.email, e.status
  FROM employees e
  JOIN users u ON u.employee_id = e.employee_id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can approve a leave request
CREATE OR REPLACE FUNCTION can_user_approve_request(user_uuid uuid, request_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role user_role;
  current_step approval_steps%ROWTYPE;
BEGIN
  -- Get user role
  SELECT u.role INTO user_role
  FROM users u
  WHERE u.id = user_uuid;
  
  -- Get current approval step
  SELECT * INTO current_step
  FROM approval_steps
  WHERE leave_request_id = request_id
  AND is_current = true;
  
  -- Check if user can approve based on role and current step
  IF current_step.approver_role = user_role THEN
    RETURN true;
  END IF;
  
  -- Admin can approve any step
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate next employee ID
CREATE OR REPLACE FUNCTION generate_next_employee_id()
RETURNS text AS $$
DECLARE
  max_id integer;
  next_id text;
BEGIN
  -- Get the maximum numeric part of employee IDs
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS integer)), 0) + 1
  INTO max_id
  FROM employees
  WHERE employee_id ~ '^EMP[0-9]+$';
  
  -- Format as EMP001, EMP002, etc.
  next_id := 'EMP' || LPAD(max_id::text, 3, '0');
  
  RETURN next_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update leave balance after approval
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  leave_days integer;
  balance_year integer;
BEGIN
  -- Only process when status changes to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get leave request details
    SELECT days_count, EXTRACT(YEAR FROM from_date)
    INTO leave_days, balance_year
    FROM leave_requests
    WHERE id = NEW.id;
    
    -- Update or create leave balance
    INSERT INTO leave_balances (employee_id, leave_type, year, used_days, total_days, remaining_days)
    VALUES (NEW.employee_id, NEW.leave_type, balance_year, leave_days, 
            COALESCE((SELECT annual_limit FROM leave_policies WHERE leave_type = NEW.leave_type AND is_active = true), 0),
            COALESCE((SELECT annual_limit FROM leave_policies WHERE leave_type = NEW.leave_type AND is_active = true), 0) - leave_days)
    ON CONFLICT (employee_id, leave_type, year)
    DO UPDATE SET
      used_days = leave_balances.used_days + leave_days,
      remaining_days = leave_balances.total_days - (leave_balances.used_days + leave_days) + leave_balances.carried_forward_days,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leave balance on approval
CREATE TRIGGER update_balance_on_leave_approval
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_approval();

-- Function to create default approval workflow for leave request
CREATE OR REPLACE FUNCTION create_default_approval_workflow(request_id uuid, requester_role user_role)
RETURNS void AS $$
BEGIN
  -- Clear existing approval steps
  DELETE FROM approval_steps WHERE leave_request_id = request_id;
  
  -- Create approval workflow based on requester role
  IF requester_role = 'hr' THEN
    -- HR requests are auto-approved
    INSERT INTO approval_steps (leave_request_id, step_order, approver_role, status, is_current)
    VALUES (request_id, 1, 'hr', 'approved', false);
  ELSIF requester_role = 'admin' THEN
    -- Admin requests need HR approval
    INSERT INTO approval_steps (leave_request_id, step_order, approver_role, status, is_current)
    VALUES (request_id, 1, 'hr', 'pending', true);
  ELSE
    -- Regular employees need line manager then HR approval
    INSERT INTO approval_steps (leave_request_id, step_order, approver_role, status, is_current)
    VALUES 
      (request_id, 1, 'line_manager', 'pending', true),
      (request_id, 2, 'hr', 'pending', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to advance approval workflow
CREATE OR REPLACE FUNCTION advance_approval_workflow(request_id uuid)
RETURNS void AS $$
DECLARE
  current_step approval_steps%ROWTYPE;
  next_step approval_steps%ROWTYPE;
  all_approved boolean;
BEGIN
  -- Get current step
  SELECT * INTO current_step
  FROM approval_steps
  WHERE leave_request_id = request_id AND is_current = true;
  
  -- Mark current step as not current
  UPDATE approval_steps
  SET is_current = false
  WHERE id = current_step.id;
  
  -- Get next step
  SELECT * INTO next_step
  FROM approval_steps
  WHERE leave_request_id = request_id 
  AND step_order > current_step.step_order
  ORDER BY step_order
  LIMIT 1;
  
  -- If there's a next step, mark it as current
  IF next_step.id IS NOT NULL THEN
    UPDATE approval_steps
    SET is_current = true
    WHERE id = next_step.id;
  ELSE
    -- Check if all steps are approved
    SELECT NOT EXISTS (
      SELECT 1 FROM approval_steps
      WHERE leave_request_id = request_id AND status != 'approved'
    ) INTO all_approved;
    
    -- Update leave request status
    IF all_approved THEN
      UPDATE leave_requests
      SET status = 'approved', updated_at = now()
      WHERE id = request_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;