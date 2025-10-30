import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { pterodactylService } from '@/lib/pterodactyl'

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

export async function POST() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get Pterodactyl user ID
    const pteroUserId = await pterodactylService.getUserIdByEmail(user.email)

    if (!pteroUserId) {
      return NextResponse.json({ error: 'Pterodactyl account not found' }, { status: 404 })
    }

    // Reset password
    const newPassword = await pterodactylService.resetUserPassword(pteroUserId)

    if (!newPassword) {
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    return NextResponse.json({ success: true, password: newPassword })
  } catch (error) {
    console.error('Failed to reset password:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
