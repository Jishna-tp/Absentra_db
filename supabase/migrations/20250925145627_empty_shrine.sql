/*
  # Create approval steps table

  1. New Tables
    - `approval_steps`
      - `id` (uuid, primary key)
      - `leave_request_id` (uuid, foreign key to leave_requests)
      - `step_order` (integer, not null)
      - `approver_role` (user_role enum, not null)
      - `approver_id` (uuid, foreign key to employees, optional)
      - `status` (leave_status enum, default 'pending')
      - `comments` (text, optional)
      - `approved_at` (timestamptz, optional)
      - `is_current` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `approval_steps` table
    - Add policies for relevant users to read/update approval steps
*/

CREATE TABLE IF NOT EXISTS approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id uuid NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  approver_role user_role NOT NULL,
  approver_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  status leave_status NOT NULL DEFAULT 'pending',
  comments text,
  approved_at timestamptz,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(leave_request_id, step_order)
);

-- Enable RLS
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;

-- Policies for approval steps
CREATE POLICY "Anyone can read approval steps for accessible leave requests"
  ON approval_steps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leave_requests lr
      WHERE lr.id = approval_steps.leave_request_id
    )
  );

CREATE POLICY "Approvers can update their approval steps"
  ON approval_steps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN employees e ON u.employee_id = e.employee_id
      WHERE u.id = auth.uid()
      AND (
        (approval_steps.approver_id = e.id) OR
        (approval_steps.approver_role = u.role AND approval_steps.is_current = true)
      )
    )
  );

CREATE POLICY "System can insert approval steps"
  ON approval_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_approval_steps_leave_request_id ON approval_steps(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approver_id ON approval_steps(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_status ON approval_steps(status);
CREATE INDEX IF NOT EXISTS idx_approval_steps_is_current ON approval_steps(is_current);
CREATE INDEX IF NOT EXISTS idx_approval_steps_step_order ON approval_steps(step_order);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_approval_steps_updated_at
  BEFORE UPDATE ON approval_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();