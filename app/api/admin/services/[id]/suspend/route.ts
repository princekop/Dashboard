import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { pterodactylService } from '@/lib/pterodactyl'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await checkAdmin()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Suspend on Pterodactyl if ID exists
    if (server.pterodactylId) {
      const success = await pterodactylService.suspendServer(server.pterodactylId)
      if (!success) {
        return NextResponse.json({ error: 'Failed to suspend on Pterodactyl' }, { status: 500 })
      }
    }

    // Update database
    await prisma.server.update({
      where: { id },
      data: { status: 'suspended' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to suspend server:', error)
    return NextResponse.json({ error: 'Failed to suspend server' }, { status: 500 })
  }
}
