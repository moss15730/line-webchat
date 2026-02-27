import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId, message } = await req.json()

  await axios.post(
    'https://api.line.me/v2/bot/message/push',
    {
      to: userId,
      messages: [{ type: 'text', text: message }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  )

  await supabase.from('messages').insert({
    line_user_id: userId,
    sender: 'admin',
    message,
  })

  return NextResponse.json({ success: true })
}