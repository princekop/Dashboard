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

async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  })
  return user?.isAdmin || false
}

// GET all announcements (admin only)
export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST create new announcement
export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, message, type, priority, isActive } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        type: type || 'info',
        priority: priority || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Failed to create announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
