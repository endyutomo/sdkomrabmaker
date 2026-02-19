import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET: Fetch all projects where user is a collaborator
 * Uses service-role client with fallback to regular client
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Missing email or userId parameter' },
        { status: 400 }
      );
    }

    console.log(`[Collab API] Fetching for user: ${userEmail} (${userId})`);

    // Try with service-role first; fallback to regular client
    let supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { persistSession: false } }
    );

    // Step 1: Query collaboration records - try flexible column selection
    let collabs: any[] = [];
    
    // First try with all columns
    let { data, error } = await supabase
      .from('project_collaborators')
      .select('*')
      .or(`user_id.eq.${userId},user_email.eq.${userEmail.toLowerCase()}`);

    if (error) {
      console.warn(`[Collab API] Full select failed: ${error.message}, trying minimal select...`);
      
      // Fallback: try just basic columns
      ({ data, error } = await supabase
        .from('project_collaborators')
        .select('id, project_id, user_id, user_email')
        .or(`user_id.eq.${userId},user_email.eq.${userEmail.toLowerCase()}`));
    }

    if (error) {
      console.error(`[Collab API] Failed to fetch collaborations:`, error.message);
      // Return empty instead of error - table might not exist yet
      return NextResponse.json([]);
    }

    collabs = data || [];
    console.log(`[Collab API] Found ${collabs.length} collab record(s)`);

    if (collabs.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: Get project details
    const projectIds = collabs
      .map(c => c.project_id)
      .filter(Boolean);

    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);

    if (projError) {
      console.error(`[Collab API] Failed to fetch projects:`, projError.message);
      return NextResponse.json([]);
    }

    // Step 3: Merge data
    const projectMap = new Map((projects || []).map(p => [p.id, p]));
    const result = collabs
      .map(c => {
        const project = projectMap.get(c.project_id);
        if (!project) return null;
        return {
          ...project,
          isCollaboration: true,
          collaborationId: c.id,
          role: c.role || 'viewer',
          notified: c.notified !== false, // Default true if missing
          isOwned: false,
        };
      })
      .filter(Boolean);

    console.log(`[Collab API] Returning ${result.length} projects`);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Collab API] Unexpected error:', error);
    // Return empty array on error - don't break the app
    return NextResponse.json([]);
  }
}


