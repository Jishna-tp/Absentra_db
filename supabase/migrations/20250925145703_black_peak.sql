/*
  # Create audit triggers for all tables

  1. Audit Triggers
    - Add audit triggers to all main tables for INSERT, UPDATE, DELETE operations
    - Automatically log changes with user information

  2. Security
    - Audit logs help track all changes for compliance and debugging
*/

-- Create audit triggers for all main tables

-- Departments audit trigger
CREATE TRIGGER audit_departments
  AFTER INSERT OR UPDATE OR DELETE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Employees audit trigger
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Users audit trigger
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Leave policies audit trigger
CREATE TRIGGER audit_leave_policies
  AFTER INSERT OR UPDATE OR DELETE ON leave_policies
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Holidays audit trigger
CREATE TRIGGER audit_holidays
  AFTER INSERT OR UPDATE OR DELETE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Leave requests audit trigger
CREATE TRIGGER audit_leave_requests
  AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Approval steps audit trigger
CREATE TRIGGER audit_approval_steps
  AFTER INSERT OR UPDATE OR DELETE ON approval_steps
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Leave balances audit trigger
CREATE TRIGGER audit_leave_balances
  AFTER INSERT OR UPDATE OR DELETE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Workflow configs audit trigger
CREATE TRIGGER audit_workflow_configs
  AFTER INSERT OR UPDATE OR DELETE ON workflow_configs
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();