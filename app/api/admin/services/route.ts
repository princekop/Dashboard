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
    const servers = await prisma.server.findMany({
      include: {
        product: {
          select: {
            name: true,
            ram: true,
            cpu: true,
            storage: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ servers })
  } catch (error) {
    console.error('Failed to fetch servers:', error)
    return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 })
  }
}
