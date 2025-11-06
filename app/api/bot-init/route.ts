import { NextResponse } from 'next/server'
import '@/lib/bot-cleanup'

export async function GET() {
  return NextResponse.json({ status: 'Bot cleanup service active' })
}
