import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { pterodactylService } from '@/lib/pterodactyl'
import { 
  generateInvoiceNumber, 
  validateInvoiceData, 
  sanitizeInvoiceItems 
} from '@/lib/invoice-utils'

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
    // Get order with user and items
    const order = await prisma.order.findUnique({
      where: { id },
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

    // Update order status
    await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'verified',
        status: 'paid'
      }
    })

    let serversCreated = 0

    // Create servers for each item
    for (const item of order.items) {
      const product = item.product
      
      // Check if user exists on Pterodactyl, create if not
      let pteroUserId = await pterodactylService.getUserIdByEmail(order.user.email)
      
      if (!pteroUserId) {
        pteroUserId = await pterodactylService.createUser(
          order.user.email,
          order.user.name || order.user.email.split('@')[0]
        )
      }

      if (pteroUserId) {
        // Create server
        const serverName = `${product.name} - ${order.user.name || order.user.email.split('@')[0]}`
        try {
          const pteroServer = await pterodactylService.createServer(
            pteroUserId,
            serverName,
            product.ram,
            product.cpu,
            product.storage
          )

          if (pteroServer) {
            // Save server to database
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + product.duration)

            await prisma.server.create({
              data: {
                userId: order.userId,
                productId: product.id,
                pterodactylId: pteroServer.id,
                pterodactylIdentifier: pteroServer.identifier,
                name: serverName,
                status: 'active',
                expiresAt
              }
            })
            serversCreated++
          }
        } catch (serverError: any) {
          console.error(`Failed to create server for product ${product.name}:`, serverError.message)
          // Continue with other items even if one fails
        }
      }
    }

    // Mark order as completed and generate invoice
    await prisma.order.update({
      where: { id },
      data: {
        status: 'completed'
      }
    })

    // Generate invoice automatically
    try {
      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findUnique({
        where: { orderId: order.id }
      })

      if (!existingInvoice) {
        // Generate unique invoice number
        const invoiceNumber = await generateInvoiceNumber()

        // Prepare and sanitize invoice items
        const invoiceItems = sanitizeInvoiceItems(
          order.items.map(item => ({
            name: item.product.name,
            description: `${item.product.ram}GB RAM, ${item.product.cpu * 100}% CPU, ${item.product.storage}GB Storage - Premium DarkByte Server`,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
          }))
        )

        // Validate invoice data before creation
        const validation = validateInvoiceData({
          orderId: order.id,
          userId: order.userId,
          customerName: order.user.name || order.user.email,
          customerEmail: order.user.email,
          items: invoiceItems,
          subtotal: order.totalAmount,
          total: order.finalAmount
        })

        if (validation.valid) {
          // Create invoice
          await prisma.invoice.create({
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
            status: 'paid',
            dueDate: new Date(order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
            paidDate: new Date()
          }
          })
        } else {
          console.error('Invoice validation failed:', validation.error)
        }
      }
    } catch (invoiceError) {
      console.error('Failed to generate invoice:', invoiceError)
      // Don't fail the entire request if invoice generation fails
      // Log for monitoring and debugging
    }

    return NextResponse.json({ 
      success: true,
      serversCreated,
      invoiceGenerated: true,
      message: `Order verified successfully. ${serversCreated} server(s) created.`
    })
  } catch (error) {
    console.error('Failed to verify order:', error)
    
    // Log detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    
    return NextResponse.json({ 
      error: 'Failed to verify order',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
