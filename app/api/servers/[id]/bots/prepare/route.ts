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
    if (!user || !user.devMode) {
      return NextResponse.json({ error: 'Developer mode required' }, { status: 403 })
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

    const settings = await prisma.pterodactylSettings.findFirst({
      where: { isActive: true }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 500 })
    }

    // Step 1: Check if cracked mode is already enabled
    let needsRestart = false
    let properties = ''
    
    try {
      // Read current server.properties using GET endpoint
      const readRes = await axios.get(
        `${settings.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/files/contents?file=${encodeURIComponent('/server.properties')}`,
        {
          headers: {
            'Authorization': `Bearer ${adminApiKey}`,
            'Accept': 'text/plain'
          }
        }
      )

      properties = readRes.data || ''
      console.log('Found server.properties, checking online-mode...')
      
      // Check if already in cracked mode
      if (properties.includes('online-mode=false')) {
        console.log('✓ Server already in cracked mode (online-mode=false)')
        return NextResponse.json({ 
          success: true,
          alreadyConfigured: true,
          needsRestart: false,
          message: 'Server already configured for bot connections.'
        })
      }
      
      console.log('Server needs cracked mode enabled')
      
      // Update online-mode to false
      if (properties.includes('online-mode=true')) {
        properties = properties.replace(/online-mode=true/g, 'online-mode=false')
        needsRestart = true
        console.log('Updated online-mode from true to false')
      } else if (properties.includes('online-mode=')) {
        // Already has the line but might be something else
        properties = properties.replace(/online-mode=.*/g, 'online-mode=false')
        needsRestart = true
      } else {
        // No online-mode line, add it
        properties += '\nonline-mode=false'
        needsRestart = true
        console.log('Added online-mode=false to server.properties')
      }

      // Write back
      if (needsRestart) {
        await axios.post(
          `${settings.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/files/write?file=${encodeURIComponent('/server.properties')}`,
          properties,
          {
            headers: {
              'Authorization': `Bearer ${adminApiKey}`,
              'Content-Type': 'text/plain'
            }
          }
        )
        console.log('Updated server.properties file')
      }
    } catch (error: any) {
      console.error('Error reading server.properties:', error.response?.status, error.message)
      
      // If file doesn't exist (404), that's okay - server might not have started yet
      if (error.response?.status === 404) {
        console.log('server.properties not found - server might not have started yet')
        return NextResponse.json({ 
          success: true,
          alreadyConfigured: true,
          needsRestart: false,
          message: 'Server not fully initialized. You can try connecting bots anyway.'
        })
      }
      
      // For other errors, don't restart - it might make things worse
      return NextResponse.json({ 
        success: true,
        alreadyConfigured: true,
        needsRestart: false,
        message: 'Could not verify server configuration. Proceeding with bot creation.'
      })
    }

    // Step 2: Restart the server only if we made changes
    if (needsRestart) {
      try {
        console.log('Restarting server to apply changes...')
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
      } catch (error) {
        console.error('Failed to restart server:', error)
      }

      return NextResponse.json({ 
        success: true,
        needsRestart: true,
        message: 'Cracked mode enabled. Server restarting...'
      })
    }

    return NextResponse.json({ 
      success: true,
      needsRestart: false,
      alreadyConfigured: true,
      message: 'Server ready for bot connections.'
    })
  } catch (error: any) {
    console.error('Failed to prepare server:', error)
    return NextResponse.json({ 
      error: 'Failed to prepare server',
      details: error.message 
    }, { status: 500 })
  }
}
