import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function getUserFromToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return await prisma.user.findUnique({ where: { id: decoded.userId } })
  } catch {
    return null
  }
}

// GET - List trash items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get trash items for this server
    const trashItems = await prisma.trashItem.findMany({
      where: { serverId: id },
      orderBy: { deletedAt: 'desc' }
    }).catch((err) => {
      console.error('Prisma trash query error:', err)
      return []
    })

    return NextResponse.json({ items: trashItems })
  } catch (error) {
    console.error('Failed to list trash:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Move item to trash
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, path, size } = body

    if (!name || !type || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create trash item with 30-day expiration
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    
    const trashItem = await prisma.trashItem.create({
      data: {
        serverId: id,
        name,
        type,
        path,
        size: size || 0,
        originalData: JSON.stringify(body.data || {}),
        deletedAt: now,
        expiresAt
      }
    })

    return NextResponse.json({ item: trashItem })
  } catch (error) {
    console.error('Failed to move to trash:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Restore item from trash
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const trashItemId = searchParams.get('itemId')

    if (!trashItemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Delete from trash (restoration logic handled in frontend/file manager)
    await prisma.trashItem.delete({
      where: { id: trashItemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to restore item:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Permanently delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const trashItemId = searchParams.get('itemId')
    const emptyAll = searchParams.get('emptyAll') === 'true'

    if (emptyAll) {
      // Delete all trash items for this server
      await prisma.trashItem.deleteMany({
        where: { serverId: id }
      })
    } else if (trashItemId) {
      // Delete specific item
      await prisma.trashItem.delete({
        where: { id: trashItemId }
      })
    } else {
      return NextResponse.json({ error: 'Item ID or emptyAll flag required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete item:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
