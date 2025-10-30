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

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get active services count
    const activeServices = await prisma.server.count({
      where: {
        userId,
        status: 'active'
      }
    })

    // Get all orders with items
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: { in: ['paid', 'completed'] }
      },
      include: {
        items: true
      }
    })

    // Calculate total spent and total saved
    let totalSpent = 0
    let totalSaved = 0

    orders.forEach(order => {
      totalSpent += order.finalAmount
      totalSaved += order.discount
    })

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Get expiring services (within 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const expiringServices = await prisma.server.findMany({
      where: {
        userId,
        status: 'active',
        expiresAt: {
          lte: sevenDaysFromNow,
          gte: new Date()
        }
      },
      include: {
        product: true
      },
      orderBy: {
        expiresAt: 'asc'
      }
    })

    return NextResponse.json({
      stats: {
        activeServices,
        totalSpent,
        totalSaved,
        pendingOrders: await prisma.order.count({
          where: {
            userId,
            status: 'pending'
          }
        })
      },
      recentOrders,
      expiringServices
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
