import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing project id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('status', 'public')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}
