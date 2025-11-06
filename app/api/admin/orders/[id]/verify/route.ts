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
    const errors: string[] = []

    console.log(`📦 Processing ${order.items.length} items for order ${id}`)

    // Create servers for each item
    for (const item of order.items) {
      const product = item.product
      console.log(`🔄 Processing product: ${product.name}`)
      
      try {
        // Check if user exists on Pterodactyl, create if not
        console.log(`👤 Checking Pterodactyl user for: ${order.user.email}`)
        let pteroUserId = await pterodactylService.getUserIdByEmail(order.user.email)
        
        if (!pteroUserId) {
          console.log(`➕ Creating Pterodactyl user for: ${order.user.email}`)
          pteroUserId = await pterodactylService.createUser(
            order.user.email,
            order.user.name || order.user.email.split('@')[0]
          )
          console.log(`✅ Pterodactyl user created with ID: ${pteroUserId}`)
        } else {
          console.log(`✅ Found existing Pterodactyl user ID: ${pteroUserId}`)
        }

        if (!pteroUserId) {
          const errorMsg = `Failed to get/create Pterodactyl user for ${order.user.email}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        // Create server
        const serverName = `${product.name} - ${order.user.name || order.user.email.split('@')[0]}`
        console.log(`🖥️ Creating Pterodactyl server: ${serverName}`)
        
        const pteroServer = await pterodactylService.createServer(
          pteroUserId,
          serverName,
          product.ram,
          product.cpu,
          product.storage
        )

        if (!pteroServer) {
          const errorMsg = `Pterodactyl server creation returned null for ${product.name}`
          console.error(`❌ ${errorMsg}`)
          errors.push(errorMsg)
          continue
        }

        console.log(`✅ Pterodactyl server created with ID: ${pteroServer.id}, Identifier: ${pteroServer.identifier}`)

        // Save server to database
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + product.duration)

        console.log(`💾 Saving server to database...`)
        const dbServer = await prisma.server.create({
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
        
        console.log(`✅ Server saved to database with ID: ${dbServer.id}`)
        serversCreated++
        
      } catch (serverError: any) {
        const errorMsg = `Failed to create server for ${product.name}: ${serverError.message}`
        console.error(`❌ ${errorMsg}`)
        console.error('Full error:', serverError)
        errors.push(errorMsg)
        // Continue with other items even if one fails
      }
    }

    console.log(`📊 Summary: ${serversCreated} servers created, ${errors.length} errors`)

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
      errors: errors.length > 0 ? errors : undefined,
      invoiceGenerated: true,
      message: errors.length > 0 
        ? `Order verified. ${serversCreated} server(s) created, ${errors.length} error(s) occurred.`
        : `Order verified successfully. ${serversCreated} server(s) created.`
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
