/*
  # Create leave requests table

  1. New Tables
    - `leave_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `leave_type` (leave_type enum, not null)
      - `from_date` (date, not null)
      - `to_date` (date, not null)
      - `reason` (text, not null)
      - `status` (text, not null, check constraint)
      - `days_count` (integer, not null, computed)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `leave_requests` table
    - Add policies for employees to read/create their own requests
    - Add policies for managers and HR to read/update relevant requests
*/

-- Create leave status enum
DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending',
  days_count integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (to_date >= from_date),
  CONSTRAINT positive_days_count CHECK (days_count > 0)
);

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policies for leave requests
CREATE POLICY "Employees can read own leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN employees e ON u.employee_id = e.employee_id
      WHERE u.id = auth.uid()
      AND e.id = leave_requests.employee_id
    )
  );

CREATE POLICY "Managers can read team leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN employees manager ON u.employee_id = manager.employee_id
      JOIN employees emp ON emp.manager_id = manager.id
      WHERE u.id = auth.uid()
      AND u.role = 'line_manager'
      AND emp.id = leave_requests.employee_id
    )
  );

CREATE POLICY "HR and Admin can read all leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('hr', 'admin')
    )
  );

CREATE POLICY "Employees can insert own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN employees e ON u.employee_id = e.employee_id
      WHERE u.id = auth.uid()
      AND e.id = leave_requests.employee_id
    )
  );

CREATE POLICY "Managers can update team leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN employees manager ON u.employee_id = manager.employee_id
      JOIN employees emp ON emp.manager_id = manager.id
      WHERE u.id = auth.uid()
      AND u.role = 'line_manager'
      AND emp.id = leave_requests.employee_id
    )
  );

CREATE POLICY "HR and Admin can update all leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('hr', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type ON leave_requests(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_requests_from_date ON leave_requests(from_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_to_date ON leave_requests(to_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate days count
CREATE OR REPLACE FUNCTION calculate_leave_days(from_date date, to_date date)
RETURNS integer AS $$
BEGIN
  RETURN (to_date - from_date) + 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate days_count
CREATE OR REPLACE FUNCTION set_leave_days_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.days_count = calculate_leave_days(NEW.from_date, NEW.to_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_leave_requests_days_count
  BEFORE INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_leave_days_count();