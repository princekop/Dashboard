import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { 
  generateInvoiceNumber, 
  validateInvoiceData, 
  sanitizeInvoiceItems,
  checkRateLimit 
} from '@/lib/invoice-utils'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Validate environment variables on startup
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using default (insecure).')
}

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

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const rateLimit = checkRateLimit(`invoice-generate-${userId}`, 5, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const body = await request.json()
    const { orderId } = body

    // Validate input
    if (!orderId || typeof orderId !== 'string' || orderId.length > 100) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { orderId }
    })

    if (existingInvoice) {
      return NextResponse.json({ 
        invoice: { ...existingInvoice, items: JSON.parse(existingInvoice.items) },
        message: 'Invoice already exists'
      })
    }

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber()

    // Prepare and sanitize invoice items
    const invoiceItems = sanitizeInvoiceItems(
      order.items.map(item => ({
        name: item.product.name,
        description: `${item.product.ram}GB RAM, ${item.product.cpu * 100}% CPU, ${item.product.storage}GB Storage`,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))
    )

    // Validate invoice data
    const validation = validateInvoiceData({
      orderId: order.id,
      userId: order.userId,
      customerName: order.user.name || order.user.email,
      customerEmail: order.user.email,
      items: invoiceItems,
      subtotal: order.totalAmount,
      total: order.finalAmount
    })

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        userId: order.userId,
        customerName: order.user.name || order.user.email,
        customerEmail: order.user.email,
        items: JSON.stringify(invoiceItems),
        subtotal: order.totalAmount,
        discount: order.discount,
        tax: 0,
        total: order.finalAmount,
        status: order.status === 'completed' ? 'paid' : 'pending',
        dueDate: new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from order
        paidDate: order.status === 'completed' ? new Date() : null
      }
    })

    return NextResponse.json({ 
      invoice: { ...invoice, items: JSON.parse(invoice.items) },
      success: true 
    })
  } catch (error) {
    console.error('Failed to generate invoice:', error)
    
    // Don't expose internal errors to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({ 
      error: 'Failed to generate invoice',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
