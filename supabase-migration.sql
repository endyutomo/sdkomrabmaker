-- SDKOM RAB MAker Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Create projects table (without status column first to avoid errors)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Draft RAB',
    type TEXT,
    specifications TEXT,
    categories JSONB DEFAULT '[]'::jsonb,
    client_name TEXT,
    creator_name TEXT,
    document_number TEXT,
    project_location TEXT,
    document_date DATE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

-- Create projects_versions table for versioning (optional)
CREATE TABLE IF NOT EXISTS projects_versions (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, version)
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create RLS policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies for projects_versions if they exist
DROP POLICY IF EXISTS "Users can view their own project versions" ON projects_versions;
DROP POLICY IF EXISTS "Users can insert their own project versions" ON projects_versions;

-- Create RLS policies for projects_versions table
CREATE POLICY "Users can view their own project versions" ON projects_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = projects_versions.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own project versions" ON projects_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = projects_versions.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data commented out to avoid foreign key constraint error
-- You can add sample data after creating actual users in your Supabase auth system
/*
INSERT INTO projects (id, user_id, title, type, specifications, categories, client_name, document_number, project_location, document_date)
VALUES
    ('sample-project-1', '00000000-0000-0000-0000-000000000000', 'RAB Gedung Perkantoran', 'Gedung Perkantoran', 'Gedung 5 lantai dengan sistem HVAC', '[]'::jsonb, 'PT. Maju Jaya', 'RAB/2024/001', 'Jakarta Pusat', '2024-01-15')
ON CONFLICT (id) DO NOTHING;
*/

-- Note: To add sample data, first create a user through Supabase Auth or use anonymous sign-in
-- Then use the actual user_id from the auth.users table
