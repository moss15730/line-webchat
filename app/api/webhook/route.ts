import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

/** LINE ส่ง GET หรือ POST ที่ events ว่างเพื่อ verify URL — ต้องตอบ 200 */
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hash = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  return hash === signature
}

export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch (e) {
    console.error('Webhook: failed to read body', e)
    return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  }

  const signature = (req.headers.get('x-line-signature') ?? '').trim()
  const secret = (process.env.LINE_CHANNEL_SECRET ?? '').trim()
  const skipVerify = process.env.SKIP_WEBHOOK_SIGNATURE_VERIFICATION === 'true'

  if (!skipVerify && secret) {
    if (!signature) {
      console.error('Webhook: missing x-line-signature header')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    if (!verifySignature(rawBody, signature, secret)) {
      console.error(
        'Webhook: signature mismatch. Check LINE_CHANNEL_SECRET (Basic settings) and that no proxy modifies the body.'
      )
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let body: { destination?: string; events?: unknown[] }
  try {
    body = JSON.parse(rawBody) as { destination?: string; events?: unknown[] }
  } catch (e) {
    console.error('Webhook: invalid JSON', e)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const events = Array.isArray(body.events) ? body.events : []
  if (events.length === 0) {
    return NextResponse.json({ status: 'ok' })
  }

  for (const event of events) {
    const e = event as { type?: string; source?: { userId?: string }; message?: { type?: string; text?: string } }
    if (e.type !== 'message' || e.message?.type !== 'text') continue

    const userId = e.source?.userId
    const text = e.message?.text
    if (!userId || text == null) continue

    try {
      let displayName = 'Test User'
      let pictureUrl = ''

      if (userId !== 'TEST123' && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        try {
          const profile = await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: {
              Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
          })
          displayName = profile.data.displayName ?? displayName
          pictureUrl = profile.data.pictureUrl ?? pictureUrl
        } catch (profileErr) {
          console.warn('Webhook: profile fetch failed for', userId, profileErr)
        }
      }

      await supabase.from('users').upsert(
        {
          line_user_id: userId,
          display_name: displayName,
          picture_url: pictureUrl || null,
        },
        { onConflict: 'line_user_id' }
      )

      await supabase.from('messages').insert({
        line_user_id: userId,
        sender: 'customer',
        message: text,
      })

      await supabase.from('users').update({ read: false }).eq('line_user_id', userId)
    } catch (err) {
      console.error('Webhook: process event failed', event, err)
    }
  }

  return NextResponse.json({ status: 'ok' })
}