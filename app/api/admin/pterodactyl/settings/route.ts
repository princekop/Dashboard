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
    const settings = await prisma.pterodactylSettings.findFirst({
      where: { isActive: true }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminId = await checkAdmin()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { panelUrl, apiKey } = await request.json()

    // Delete existing settings
    await prisma.pterodactylSettings.deleteMany({})

    // Create new settings
    const settings = await prisma.pterodactylSettings.create({
      data: {
        panelUrl,
        apiKey,
        isActive: true
      }
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
