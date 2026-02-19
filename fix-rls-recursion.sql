-- Complete Fix for RLS and Database Issues
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================================
-- PART 1: Drop ALL existing policies (brute force, no errors)
-- ============================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('projects', 'project_collaborators')
        AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================================
-- PART 2: Ensure tables exist with correct structure
-- ============================================================

-- Create projects table if not exists (support both TEXT and UUID id types)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Draft RAB',
    type TEXT,
    specifications TEXT,
    categories JSONB DEFAULT '[]'::jsonb,
    client_name TEXT,
    creator_name TEXT,
    document_number TEXT,
    project_location TEXT,
    document_date TEXT,
    status TEXT DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='type') THEN
        ALTER TABLE projects ADD COLUMN type TEXT;
    END IF;
    
    -- Add specifications column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='specifications') THEN
        ALTER TABLE projects ADD COLUMN specifications TEXT;
    END IF;
    
    -- Add categories column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='categories') THEN
        ALTER TABLE projects ADD COLUMN categories JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add document_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='document_number') THEN
        ALTER TABLE projects ADD COLUMN document_number TEXT;
    END IF;
    
    -- Add project_location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='project_location') THEN
        ALTER TABLE projects ADD COLUMN project_location TEXT;
    END IF;
    
    -- Add document_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='document_date') THEN
        ALTER TABLE projects ADD COLUMN document_date TEXT;
    END IF;
    
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='status') THEN
        ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;
    
    -- Add version column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='version') THEN
        ALTER TABLE projects ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 3: Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS collaborators_user_id_idx ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS collaborators_project_id_idx ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS collaborators_user_email_idx ON project_collaborators(user_email);

-- ============================================================
-- PART 4: Update existing collaborators user_id from email
-- ============================================================
UPDATE project_collaborators
SET user_id = auth.users.id
FROM auth.users
WHERE project_collaborators.user_email = auth.users.email
AND project_collaborators.user_id IS NULL;

-- ============================================================
-- PART 5: Enable RLS
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 6: Create NEW policies
-- Uses auth.uid() and auth.email() - Supabase built-in functions
-- NO subqueries to auth.users (which are blocked)
-- ============================================================

-- [projects] view own projects
CREATE POLICY "proj_select_own" ON projects
    FOR SELECT USING (user_id = auth.uid());

-- [projects] view projects where user is collaborator (by user_id OR email)
CREATE POLICY "proj_select_collab" ON projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM project_collaborators
            WHERE user_id = auth.uid()
               OR user_email = auth.email()
        )
    );

-- [projects] insert, update, delete own
CREATE POLICY "proj_insert_own" ON projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "proj_update_own" ON projects
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "proj_update_collab_editor" ON projects
    FOR UPDATE USING (
        id IN (
            SELECT project_id FROM project_collaborators
            WHERE (user_id = auth.uid() OR user_email = auth.email())
              AND role = 'editor'
        )
    );

CREATE POLICY "proj_delete_own" ON projects
    FOR DELETE USING (user_id = auth.uid());

-- [project_collaborators] view as the inviter (project owner)
CREATE POLICY "collab_select_as_owner" ON project_collaborators
    FOR SELECT USING (invited_by = auth.uid());

-- [project_collaborators] view own collaboration records (by user_id OR email)
CREATE POLICY "collab_select_own" ON project_collaborators
    FOR SELECT USING (
        user_id = auth.uid()
        OR user_email = auth.email()
    );

-- [project_collaborators] insert, update, delete (only project owner/inviter)
CREATE POLICY "collab_insert" ON project_collaborators
    FOR INSERT WITH CHECK (invited_by = auth.uid());

CREATE POLICY "collab_update" ON project_collaborators
    FOR UPDATE USING (invited_by = auth.uid());

CREATE POLICY "collab_delete" ON project_collaborators
    FOR DELETE USING (invited_by = auth.uid());

-- ============================================================
-- PART 7: Verify
-- ============================================================
SELECT 'Migration completed successfully!' AS status;

SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('projects', 'project_collaborators')
ORDER BY tablename, policyname;
