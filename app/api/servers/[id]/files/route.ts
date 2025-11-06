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

    const { searchParams } = new URL(request.url)
    const directory = searchParams.get('directory') || '/'

    const files = await pterodactylService.listFiles(
      server.pterodactylIdentifier,
      adminApiKey,
      directory
    )

    return NextResponse.json(files)
  } catch (error) {
    console.error('Failed to list files:', error)
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

    const body = await request.json()
    const { action, root, files, name, content, file } = body

    switch (action) {
      case 'delete':
        await pterodactylService.deleteFile(
          server.pterodactylIdentifier,
          adminApiKey,
          root,
          files
        )
        break
      case 'create-folder':
        await pterodactylService.createFolder(
          server.pterodactylIdentifier,
          adminApiKey,
          root,
          name
        )
        break
      case 'rename':
        await pterodactylService.renameFile(
          server.pterodactylIdentifier,
          adminApiKey,
          root,
          files
        )
        break
      case 'compress':
        const result = await pterodactylService.compressFiles(
          server.pterodactylIdentifier,
          adminApiKey,
          root,
          files
        )
        return NextResponse.json(result)
      case 'decompress':
        await pterodactylService.decompressFile(
          server.pterodactylIdentifier,
          adminApiKey,
          root,
          file
        )
        break
      case 'write':
        await pterodactylService.writeFile(
          server.pterodactylIdentifier,
          adminApiKey,
          file,
          content
        )
        break
      case 'read':
        const fileContent = await pterodactylService.getFileContents(
          server.pterodactylIdentifier,
          adminApiKey,
          file
        )
        return NextResponse.json({ content: fileContent })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to perform file operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
