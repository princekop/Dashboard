import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { orderId, message, mediaUrl, mediaType } = await request.json()

    if (!message?.trim() && !mediaUrl) {
      return NextResponse.json({ error: 'Message or media is required' }, { status: 400 })
    }

    // Set expiration time for media (24 hours from now)
    const expiresAt = mediaUrl ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null

    const chatMessage = await prisma.chatMessage.create({
      data: {
        orderId,
        userId,
        message: message?.trim() || '',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        expiresAt,
        isAdmin: false
      }
    })

    return NextResponse.json({ success: true, message: chatMessage })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
