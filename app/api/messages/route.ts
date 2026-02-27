import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = req.nextUrl.searchParams.get('userId')

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('line_user_id', userId)
    .order('created_at', { ascending: true })

  return NextResponse.json(data)
}