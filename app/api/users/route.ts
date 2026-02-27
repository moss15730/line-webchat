import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/auth'

export async function GET() {
  const session = await getSessionFromCookie()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data } = await supabase.from('users').select('*')
  return NextResponse.json(data)
}