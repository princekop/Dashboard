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

export async function GET(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const rateLimit = checkRateLimit(`invoice-list-${userId}`, 20, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    // Add pagination support for production
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const parsedInvoices = invoices.map(inv => ({
      ...inv,
      items: parseInvoiceItems(inv.items)
    }))

    return NextResponse.json({ 
      invoices: parsedInvoices,
      pagination: {
        limit,
        offset,
        total: await prisma.invoice.count({ where: { userId } })
      },
      success: true
    })
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch invoices',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
