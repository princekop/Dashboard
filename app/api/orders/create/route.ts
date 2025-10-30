import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const { items, totalAmount, discount, finalAmount, isFirstOrder } = await request.json()

    const order = await prisma.order.create({
      data: {
        userId: decoded.userId,
        totalAmount,
        discount,
        finalAmount,
        isFirstOrder,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: true
      }
    })

    // Clear user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId: decoded.userId }
    })
    
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
