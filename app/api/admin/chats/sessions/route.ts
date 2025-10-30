import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isAdmin: true }
    })
    return user?.isAdmin ? decoded.userId : null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const adminId = await checkAdmin()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all orders with chat messages
    const orders = await prisma.order.findMany({
      where: {
        chatMessages: {
          some: {}
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        chatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const sessions = orders.map(order => ({
      orderId: order.id,
      userName: order.user.name || order.user.email,
      userEmail: order.user.email,
      lastMessage: order.chatMessages[0]?.message || 'No messages yet',
      unreadCount: 0 // Can be enhanced with read/unread tracking
    }))

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
