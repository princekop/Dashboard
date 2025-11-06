import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function getUserFromToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return await prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            name: true,
            ram: true,
            cpu: true,
            storage: true
          }
        }
      }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    // Check if user owns this server or is admin
    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - You do not own this server' }, { status: 403 })
    }

    return NextResponse.json(server)
  } catch (error) {
    console.error('Failed to get server info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
