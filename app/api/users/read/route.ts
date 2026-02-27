import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { line_user_id, read } = body as { line_user_id?: string; read?: boolean }

  if (typeof line_user_id !== 'string' || typeof read !== 'boolean') {
    return NextResponse.json(
      { error: 'Body must include line_user_id (string) and read (boolean)' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('users')
    .update({ read })
    .eq('line_user_id', line_user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
