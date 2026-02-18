-- Add Collaborators Feature to SDKOM RAB Maker
-- Run this in Supabase SQL Editor AFTER running supabase-migration.sql

-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_email)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS collaborators_project_id_idx ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS collaborators_user_email_idx ON project_collaborators(user_email);

-- Enable Row Level Security
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view collaborators of their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Collaborators can view their collaborations" ON project_collaborators;

-- RLS Policies for project_collaborators
CREATE POLICY "Users can view collaborators of their projects" ON project_collaborators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_collaborators.project_id
            AND projects.user_id = auth.uid()
        )
        OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_collaborators.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Update existing projects policies to include collaborators
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;

-- Create helper function to get current user email
CREATE OR REPLACE FUNCTION auth.user_email() 
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Allow viewing if owner OR collaborator (simplified to avoid recursion)
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (
        user_id = auth.uid()
        OR id IN (
            SELECT project_id FROM project_collaborators
            WHERE user_email = auth.user_email()
        )
    );

-- Allow updating if owner OR editor collaborator
CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (
        user_id = auth.uid()
        OR (
            id IN (
                SELECT project_id FROM project_collaborators
                WHERE user_email = auth.user_email()
                AND role = 'editor'
            )
        )
    );

-- Note: Only project owners can INSERT and DELETE projects (not collaborators)
