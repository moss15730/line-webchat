import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/auth'
import { formatMessageTime } from '@/lib/chatUtils'

export async function GET() {
  const session = await getSessionFromCookie()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('line_user_id, message, created_at')
    .order('created_at', { ascending: false })

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  const latestByUser = new Map<string, { message: string; created_at: string }>()

  for (const msg of messages ?? []) {
    const key = (msg as any).line_user_id as string
    if (!latestByUser.has(key)) {
      latestByUser.set(key, {
        message: (msg as any).message as string,
        created_at: (msg as any).created_at as string,
      })
    }
  }

  const usersWithLastMessage =
    users?.map(user => {
      const last = latestByUser.get((user as any).line_user_id as string)
      return {
        ...user,
        last_message: last?.message ?? (user as any).last_message ?? null,
        last_time: last
          ? formatMessageTime(last.created_at)
          : (user as any).last_time ?? undefined,
        last_created_at: last
          ? last.created_at
          : (user as any).last_created_at ?? undefined,
      }
    }) ?? []

  return NextResponse.json(usersWithLastMessage, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  })
}