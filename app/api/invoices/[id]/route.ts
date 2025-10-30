import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { parseInvoiceItems, checkRateLimit } from '@/lib/invoice-utils'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const rateLimit = checkRateLimit(`invoice-view-${userId}`, 30, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const { id } = await params
    
    // Validate input
    if (!id || typeof id !== 'string' || id.length > 100) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }
    
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ 
      invoice: { ...invoice, items: parseInvoiceItems(invoice.items) },
      success: true
    })
  } catch (error) {
    console.error('Failed to fetch invoice:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch invoice',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
