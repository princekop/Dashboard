import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { pterodactylService } from '@/lib/pterodactyl'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminApiKey = process.env.PTERODACTYL_CLIENT_KEY
    if (!adminApiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server || !server.pterodactylIdentifier) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!user.pterodactylApiKey) {
      return NextResponse.json({ error: 'User API key not configured' }, { status: 400 })
    }

    const backups = await pterodactylService.listBackups(
      server.pterodactylIdentifier,
      user.pterodactylApiKey
    )

    return NextResponse.json(backups)
  } catch (error) {
    console.error('Failed to list backups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminApiKey = process.env.PTERODACTYL_CLIENT_KEY
    if (!adminApiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server || !server.pterodactylIdentifier) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!user.pterodactylApiKey) {
      return NextResponse.json({ error: 'User API key not configured' }, { status: 400 })
    }

    const body = await request.json()
    const { name } = body

    const backup = await pterodactylService.createBackup(
      server.pterodactylIdentifier,
      user.pterodactylApiKey,
      name
    )

    return NextResponse.json(backup)
  } catch (error) {
    console.error('Failed to create backup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminApiKey = process.env.PTERODACTYL_CLIENT_KEY
    if (!adminApiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server || !server.pterodactylIdentifier) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!user.pterodactylApiKey) {
      return NextResponse.json({ error: 'User API key not configured' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const backupUuid = searchParams.get('uuid')

    if (!backupUuid) {
      return NextResponse.json({ error: 'Backup UUID is required' }, { status: 400 })
    }

    await pterodactylService.deleteBackup(
      server.pterodactylIdentifier,
      user.pterodactylApiKey,
      backupUuid
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete backup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
