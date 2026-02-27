import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

export async function POST(req: NextRequest) {
  const body = await req.json()

  console.log("🔥 WEBHOOK HIT")
  console.log(JSON.stringify(body, null, 2))
  
  const events = body.events

  for (const event of events) {
    if (event.type === 'message') {
      const userId = event.source.userId
      const text = event.message.text

      // profile
      const profile = await axios.get(
        `https://api.line.me/v2/bot/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
        }
      )

      // user
      await supabase.from('users').upsert({
        line_user_id: userId,
        display_name: profile.data.displayName,
        picture_url: profile.data.pictureUrl,
      })

      // message
      await supabase.from('messages').insert({
        line_user_id: userId,
        sender: 'customer',
        message: text,
      })
    }
  }

  return NextResponse.json({ status: 'ok' })
}