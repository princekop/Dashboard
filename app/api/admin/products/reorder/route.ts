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

// POST update product display order
export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { productOrders } = body // Array of { id, displayOrder }

    if (!Array.isArray(productOrders)) {
      return NextResponse.json(
        { error: 'productOrders must be an array' },
        { status: 400 }
      )
    }

    // Update each product's display order
    await Promise.all(
      productOrders.map((item: { id: string; displayOrder: number }) =>
        prisma.product.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder products:', error)
    return NextResponse.json(
      { error: 'Failed to reorder products' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
