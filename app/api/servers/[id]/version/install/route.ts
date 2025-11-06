import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
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
    const { serverType, version, build } = body

    if (!serverType || !version || !build) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get Pterodactyl settings
    const settings = await prisma.pterodactylSettings.findFirst({
      where: { isActive: true }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 500 })
    }

    // Download the server jar
    let downloadUrl = ''
    let fileName = 'server.jar'

    if (serverType === 'paper') {
      downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${build}/downloads/paper-${version}-${build}.jar`
    } else if (serverType === 'purpur') {
      downloadUrl = `https://api.purpurmc.org/v2/purpur/${version}/${build}/download`
    } else {
      return NextResponse.json({ error: 'Unsupported server type' }, { status: 400 })
    }

    // Download the jar file
    const jarResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer'
    })

    const jarBuffer = Buffer.from(jarResponse.data)

    // Upload to Pterodactyl server
    await axios.post(
      `${settings.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/files/write?file=${encodeURIComponent('/server.jar')}`,
      jarBuffer,
      {
        headers: {
          'Authorization': `Bearer ${adminApiKey}`,
          'Content-Type': 'application/octet-stream'
        }
      }
    )

    // Restart the server
    await axios.post(
      `${settings.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/power`,
      { signal: 'restart' },
      {
        headers: {
          'Authorization': `Bearer ${adminApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return NextResponse.json({ 
      success: true,
      message: `${serverType} ${version} build ${build} installed successfully`
    })
  } catch (error: any) {
    console.error('Failed to install version:', error)
    return NextResponse.json({ 
      error: 'Failed to install version',
      details: error.message 
    }, { status: 500 })
  }
}
