-- Add Notification System for Collaborators
-- Run this in Supabase SQL Editor

-- Add notified column to track if user has seen the collaboration invite
ALTER TABLE project_collaborators 
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;

-- Add function to mark notification as read
CREATE OR REPLACE FUNCTION mark_collaboration_notified(collab_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE project_collaborators 
  SET notified = TRUE 
  WHERE id = collab_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easy querying of collaboration notifications
CREATE OR REPLACE VIEW collaboration_notifications AS
SELECT 
  pc.id,
  pc.project_id,
  pc.user_email,
  pc.user_id,
  pc.role,
  pc.created_at,
  pc.notified,
  p.name as project_name,
  (SELECT email FROM auth.users WHERE id = p.user_id) as owner_email
FROM project_collaborators pc
JOIN projects p ON p.id = pc.project_id
WHERE pc.notified = FALSE;

SELECT 'Notification system created successfully!' AS status;
