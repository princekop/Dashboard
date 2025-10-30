import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json({ items: [] })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    let cart = await prisma.cart.findFirst({
      where: { userId: decoded.userId },
      include: {
        items: true
      }
    })

    if (!cart) {
      return NextResponse.json({ items: [] })
    }

    // Fetch product details for each cart item
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: product || null
        }
      })
    )

    return NextResponse.json({ items: itemsWithProducts.filter(item => item.product !== null) })
  } catch (error) {
    console.error('Failed to fetch cart:', error)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const { productId, quantity } = await request.json()

    let cart = await prisma.cart.findFirst({
      where: { userId: decoded.userId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: decoded.userId }
      })
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId
      }
    })

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to add to cart:', error)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const cart = await prisma.cart.findFirst({
      where: { userId: decoded.userId }
    })

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to clear cart:', error)
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
  }
}
