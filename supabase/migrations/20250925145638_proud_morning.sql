/*
  # Create leave balances table

  1. New Tables
    - `leave_balances`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `leave_type` (leave_type enum, not null)
      - `year` (integer, not null)
      - `total_days` (integer, not null, default 0)
      - `used_days` (integer, not null, default 0)
      - `remaining_days` (integer, not null, computed)
      - `carried_forward_days` (integer, not null, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `leave_balances` table
    - Add policies for employees to read their own balances
    - Add policies for managers and HR to read relevant balances
*/

CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  year integer NOT NULL,
  total_days integer NOT NULL DEFAULT 0 CHECK (total_days >= 0),
  used_days integer NOT NULL DEFAULT 0 CHECK (used_days >= 0),
  remaining_days integer NOT NULL DEFAULT 0 CHECK (remaining_days >= 0),
  carried_forward_days integer NOT NULL DEFAULT 0 CHECK (carried_forward_days >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, leave_type, year),
  CONSTRAINT valid_balance CHECK (remaining_days = total_days - used_days + carried_forward_days)
);

-- Enable RLS
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Policies for leave balances
CREATE POLICY "Employees can read own leave balances"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN employees e ON u.employee_id = e.employee_id
      WHERE u.id = auth.uid()
      AND e.id = leave_balances.employee_id
    )
  );

CREATE POLICY "Managers can read team leave balances"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN employees manager ON u.employee_id = manager.employee_id
      JOIN employees emp ON emp.manager_id = manager.id
      WHERE u.id = auth.uid()
      AND u.role = 'line_manager'
      AND emp.id = leave_balances.employee_id
    )
  );

CREATE POLICY "HR and Admin can read all leave balances"
  ON leave_balances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('hr', 'admin')
    )
  );

CREATE POLICY "HR and Admin can manage leave balances"
  ON leave_balances
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('hr', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_leave_type ON leave_balances(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate remaining days
CREATE OR REPLACE FUNCTION calculate_remaining_days()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_days = NEW.total_days - NEW.used_days + NEW.carried_forward_days;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_leave_balance_remaining_days
  BEFORE INSERT OR UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION calculate_remaining_days();