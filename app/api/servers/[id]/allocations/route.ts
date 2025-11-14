import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { pterodactylService } from '@/lib/pterodactyl'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import axios from 'axios'

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

    const allocations = await pterodactylService.listAllocations(
      server.pterodactylIdentifier,
      user.pterodactylApiKey
    )

    return NextResponse.json(allocations)
  } catch (error) {
    console.error('Failed to list allocations:', error)
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

    const config = await pterodactylService.getConfig()
    if (!config) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 500 })
    }

    const response = await axios.post(
      `${config.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/network/allocations`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${user.pterodactylApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Failed to create allocation:', error?.response?.data || error?.message || error)
    
    // Return more specific error message
    const errorMessage = error?.response?.data?.errors?.[0]?.detail 
      || error?.response?.data?.message
      || 'Cannot create new port allocation. Server may have reached maximum allocations or no ports available.'
    
    return NextResponse.json({ 
      error: errorMessage,
      status: error?.response?.status 
    }, { status: error?.response?.status || 500 })
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
    const allocationId = searchParams.get('allocationId')

    if (!allocationId) {
      return NextResponse.json({ error: 'Allocation ID is required' }, { status: 400 })
    }

    const config = await pterodactylService.getConfig()
    if (!config) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 500 })
    }

    await axios.delete(
      `${config.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/network/allocations/${allocationId}`,
      {
        headers: {
          'Authorization': `Bearer ${user.pterodactylApiKey}`,
          'Accept': 'application/json'
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete allocation:', error?.response?.data || error?.message || error)
    
    const errorMessage = error?.response?.data?.errors?.[0]?.detail 
      || error?.response?.data?.message
      || 'Cannot delete port allocation. It may be the primary port or in use.'
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: error?.response?.status || 500 })
  }
}
