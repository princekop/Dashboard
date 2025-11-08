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

    // Download file with timeout and proper error handling
    console.log(`Downloading ${filename} from ${downloadUrl}`)
    let fileData: Buffer
    try {
      const fileResponse = await axios.get(downloadUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout for large files
        maxContentLength: 100 * 1024 * 1024, // 100MB max
        maxBodyLength: 100 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ServerManager/1.0)'
        }
      })
      fileData = Buffer.from(fileResponse.data)
      console.log(`Downloaded ${fileData.length} bytes`)
    } catch (downloadError: any) {
      console.error('Download failed:', downloadError.message)
      return NextResponse.json({ 
        error: 'Failed to download plugin/mod',
        details: downloadError.code === 'ECONNABORTED' 
          ? 'Download timeout - file too large or slow connection' 
          : downloadError.message
      }, { status: 500 })
    }

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
    let uploadEndpoint: string
    try {
      const uploadTokenRes = await axios.get(uploadUrl, {
        headers: {
          'Authorization': `Bearer ${adminApiKey}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      })
      uploadEndpoint = uploadTokenRes.data.attributes.url
    } catch (tokenError: any) {
      console.error('Failed to get upload token:', tokenError.message)
      return NextResponse.json({ 
        error: 'Failed to get upload token',
        details: tokenError.message
      }, { status: 500 })
    }

    // Upload file
    try {
      const FormData = require('form-data')
      const form = new FormData()
      form.append('files', fileData, filename)

      await axios.post(`${uploadEndpoint}&directory=${encodeURIComponent(installPath)}`, form, {
        headers: {
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000 // 2 minute timeout for upload
      })
      console.log(`Successfully uploaded ${filename}`)
    } catch (uploadError: any) {
      console.error('Upload failed:', uploadError.message)
      return NextResponse.json({ 
        error: 'Failed to upload file to server',
        details: uploadError.code === 'ECONNABORTED' 
          ? 'Upload timeout - file too large' 
          : uploadError.message
      }, { status: 500 })
    }

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
