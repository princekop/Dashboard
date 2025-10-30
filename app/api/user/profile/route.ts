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

// Get user profile
export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, avatar } = body

    // Validate name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      if (name.length > 100) {
        return NextResponse.json({ error: 'Name too long' }, { status: 400 })
      }
    }

    // Validate avatar URL
    if (avatar !== undefined && typeof avatar !== 'string') {
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 })
    }

    // Update user
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (avatar !== undefined) updateData.avatar = avatar

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ 
      success: true,
      user,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ 
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
