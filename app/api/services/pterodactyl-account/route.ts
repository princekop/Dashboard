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

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    const settings = await prisma.pterodactylSettings.findFirst({
      where: { isActive: true }
    })

    if (!settings || !user) {
      return NextResponse.json({ account: null })
    }

    return NextResponse.json({
      account: {
        email: user.email,
        panelUrl: settings.panelUrl
      }
    })
  } catch (error) {
    console.error('Failed to fetch account:', error)
    return NextResponse.json({ account: null })
  }
}
