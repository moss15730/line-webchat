import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = req.nextUrl.searchParams.get('userId')
  const limitParam = req.nextUrl.searchParams.get('limit')
  const before = req.nextUrl.searchParams.get('before')
  const after = req.nextUrl.searchParams.get('after')

  const limit = Number.isNaN(Number(limitParam)) || !limitParam ? 30 : Number(limitParam)

  if (!userId) {
    return NextResponse.json([], { status: 200 })
  }

  if (after) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('line_user_id', userId)
      .gt('created_at', after)
      .order('created_at', { ascending: true })
      .limit(100)
    return NextResponse.json(data ?? [])
  }

  let query = supabase
    .from('messages')
    .select('*')
    .eq('line_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data } = await query

  return NextResponse.json(data ?? [])
}