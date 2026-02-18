import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase-server';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'Missing project id' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ status: 'public' })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, project: data });
}
