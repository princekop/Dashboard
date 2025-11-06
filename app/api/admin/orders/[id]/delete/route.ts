import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return false

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isAdmin: true }
    })
    return user?.isAdmin || false
  } catch {
    return false
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Delete order items first (foreign key constraint)
    await prisma.orderItem.deleteMany({
      where: { orderId: id }
    })

    // Delete chat messages
    await prisma.chatMessage.deleteMany({
      where: { orderId: id }
    })

    // Delete invoice if exists
    await prisma.invoice.deleteMany({
      where: { orderId: id }
    })

    // Delete the order
    await prisma.order.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Failed to delete order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
