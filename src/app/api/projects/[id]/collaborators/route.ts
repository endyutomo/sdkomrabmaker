import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { email, role = 'editor', userId } = body;

    if (!email || !email.endsWith('@sdkom.co.id')) {
      return NextResponse.json(
        { error: 'Hanya email @sdkom.co.id yang dapat ditambahkan sebagai kolaborator' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Lookup user_id from email using service role client
    const { data: targetUser } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = targetUser?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan. Pastikan user sudah terdaftar.' },
        { status: 404 }
      );
    }

    // Check if current user is project owner
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (!project || project.user_id !== userId) {
      return NextResponse.json(
        { error: 'Hanya pemilik proyek yang dapat menambah kolaborator' },
        { status: 403 }
      );
    }

    // Add collaborator
    const { data, error } = await supabaseAdmin
      .from('project_collaborators')
      .insert({
        project_id: projectId,
        user_email: email.toLowerCase(),
        user_id: foundUser.id,
        role,
        invited_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email sudah ditambahkan sebagai kolaborator' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true, collaborator: data });
  } catch (error: any) {
    console.error('Add collaborator error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add collaborator' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_email', email.toLowerCase());

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}
