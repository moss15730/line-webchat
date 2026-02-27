import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const events = body.events

        for (const event of events) {
            if (event.type === 'message') {
                const userId = event.source.userId
                const text = event.message.text

                let displayName = "Test User"
                let pictureUrl = ""

                if (userId !== "TEST123") {
                    const profile = await axios.get(
                        `https://api.line.me/v2/bot/profile/${userId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                            },
                        }
                    )

                    displayName = profile.data.displayName
                    pictureUrl = profile.data.pictureUrl
                }

                await supabase.from('users').upsert({
                    line_user_id: userId,
                    display_name: displayName,
                    picture_url: pictureUrl,
                })

                await supabase.from('messages').insert({
                    line_user_id: userId,
                    sender: 'customer',
                    message: text,
                })

                await supabase
                    .from('users')
                    .update({ read: false })
                    .eq('line_user_id', userId)
            }
        }

        return NextResponse.json({ status: 'ok' })
    } catch (err: any) {
        console.error(err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}