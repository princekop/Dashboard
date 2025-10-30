import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ isFirstOrder: false })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const orderCount = await prisma.order.count({
      where: { 
        userId: decoded.userId,
        status: { in: ['completed', 'pending'] }
      }
    })

    return NextResponse.json({ isFirstOrder: orderCount === 0 })
  } catch (error) {
    console.error('Failed to check first order:', error)
    return NextResponse.json({ isFirstOrder: false })
  }
}
