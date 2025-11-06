import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { pterodactylService } from '@/lib/pterodactyl'

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

    const adminApiKey = process.env.PTERODACTYL_CLIENT_KEY
    if (!adminApiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { projectId, downloadUrl, filename, serverType, needsRestart } = await request.json()

    // Determine installation directory
    let installPath = '/plugins'
    if (['forge', 'fabric'].includes(serverType)) {
      installPath = '/mods'
    }

    // Download file
    console.log(`Downloading ${filename} from ${downloadUrl}`)
    const fileResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
    const fileData = Buffer.from(fileResponse.data)

    // Upload to server
    console.log(`Uploading ${filename} to ${installPath}`)
    const config = await pterodactylService.getConfig()
    if (!config) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 500 })
    }

    // Create plugins/mods directory if it doesn't exist
    try {
      await axios.post(
        `${config.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/files/create-folder`,
        { root: '/', name: installPath.substring(1) },
        {
          headers: {
            'Authorization': `Bearer ${adminApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Upload file using Pterodactyl upload endpoint
    const uploadUrl = `${config.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/files/upload`
    
    // Get upload URL
    const uploadTokenRes = await axios.get(uploadUrl, {
      headers: {
        'Authorization': `Bearer ${adminApiKey}`,
        'Accept': 'application/json'
      }
    })

    const uploadEndpoint = uploadTokenRes.data.attributes.url

    // Upload file
    const FormData = require('form-data')
    const form = new FormData()
    form.append('files', fileData, filename)

    await axios.post(`${uploadEndpoint}&directory=${encodeURIComponent(installPath)}`, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })

    // Restart server if needed
    let restarted = false
    if (needsRestart) {
      try {
        await pterodactylService.sendPowerAction(server.pterodactylIdentifier, adminApiKey, 'restart')
        restarted = true
      } catch (error) {
        console.error('Failed to restart server:', error)
      }
    }

    return NextResponse.json({
      success: true,
      filename,
      installPath,
      restarted,
      message: `Successfully installed ${filename} to ${installPath}${restarted ? ' and restarted server' : ''}`
    })

  } catch (error: any) {
    console.error('Installation failed:', error)
    return NextResponse.json({ 
      error: 'Failed to install plugin/mod',
      details: error?.message 
    }, { status: 500 })
  }
}
