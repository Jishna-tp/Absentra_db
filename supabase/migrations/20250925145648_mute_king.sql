/*
  # Create workflow configurations table

  1. New Tables
    - `workflow_configs`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `steps` (jsonb, not null) - Array of workflow steps
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `workflow_configs` table
    - Add policies for authenticated users to read active workflows
    - Add policies for admin users to manage workflows
*/

CREATE TABLE IF NOT EXISTS workflow_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  steps jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workflow_configs ENABLE ROW LEVEL SECURITY;

-- Policies for workflow configs
CREATE POLICY "Anyone can read active workflow configs"
  ON workflow_configs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can read all workflow configs"
  ON workflow_configs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage workflow configs"
  ON workflow_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_configs_is_active ON workflow_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_configs_name ON workflow_configs(name);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_workflow_configs_updated_at
  BEFORE UPDATE ON workflow_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();