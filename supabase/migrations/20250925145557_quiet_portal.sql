/*
  # Create leave policies table

  1. New Tables
    - `leave_policies`
      - `id` (uuid, primary key)
      - `leave_type` (text, not null, check constraint)
      - `annual_limit` (integer, not null)
      - `min_days_notice` (integer, not null, default 0)
      - `max_consecutive_days` (integer, not null)
      - `carry_forward_allowed` (boolean, default false)
      - `carry_forward_limit` (integer, optional)
      - `requires_medical_certificate` (boolean, default false)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `leave_policies` table
    - Add policies for authenticated users to read active policies
    - Add policies for admin users to manage policies
*/

-- Create leave type enum
DO $$ BEGIN
  CREATE TYPE leave_type AS ENUM ('casual', 'sick', 'paid', 'personal', 'maternity', 'paternity');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS leave_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type leave_type NOT NULL,
  annual_limit integer NOT NULL CHECK (annual_limit > 0),
  min_days_notice integer NOT NULL DEFAULT 0 CHECK (min_days_notice >= 0),
  max_consecutive_days integer NOT NULL CHECK (max_consecutive_days > 0),
  carry_forward_allowed boolean DEFAULT false,
  carry_forward_limit integer CHECK (carry_forward_limit >= 0),
  requires_medical_certificate boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(leave_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;

-- Policies for leave policies
CREATE POLICY "Anyone can read active leave policies"
  ON leave_policies
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can read all leave policies"
  ON leave_policies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert leave policies"
  ON leave_policies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update leave policies"
  ON leave_policies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_policies_leave_type ON leave_policies(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_policies_is_active ON leave_policies(is_active);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_leave_policies_updated_at
  BEFORE UPDATE ON leave_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();