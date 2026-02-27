import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  console.log('LINE Webhook Event:', JSON.stringify(body, null, 2))

  return NextResponse.json({ status: 'ok' })
}