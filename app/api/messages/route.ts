import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('line_user_id', userId)
    .order('created_at', { ascending: true })

  return NextResponse.json(data)
}