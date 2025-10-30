import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function checkAdmin(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

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

export async function GET(request: NextRequest) {
  const userId = await checkAdmin(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await checkAdmin(request)
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, imageUrl, ram, cpu, storage, price, billing, duration } = body

    if (!name || !ram || !cpu || !storage || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        ram: parseInt(ram),
        cpu: parseInt(cpu),
        storage: parseInt(storage),
        price: parseFloat(price),
        billing: billing || 'monthly',
        duration: parseInt(duration) || 30,
        isActive: true
      }
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
