import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSessionToken, hashPassword, SESSION_COOKIE } from '@/lib/auth'

type LoginUser = {
  user_id: string
  role: 'admin' | 'user'
  password_hash: string
}

export async function POST(req: NextRequest) {
  const { userId, password } = await req.json()

  if (!userId || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('users_login')
    .select('user_id, role, password_hash')
    .eq('user_id', userId)
    .maybeSingle<LoginUser>()

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = createSessionToken({ userId: data.user_id, role: data.role })

  const response = NextResponse.json({ ok: true, role: data.role })

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}