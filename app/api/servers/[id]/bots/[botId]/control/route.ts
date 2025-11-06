import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { botInstances } from '@/lib/bot-store'

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
  { params }: { params: Promise<{ id: string; botId: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user || !user.devMode) {
      return NextResponse.json({ error: 'Developer mode required' }, { status: 403 })
    }

    const { id, botId } = await params
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
    const { action } = body

    // Get bot from database
    const botData = await prisma.bot.findUnique({
      where: { id: botId }
    })

    if (!botData) {
      console.log(`Control failed: Bot ${botId} not found in database`)
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Get bot instance
    const bot = botInstances.get(botId)

    if (!bot) {
      console.log(`Control failed: Bot ${botData.username} (${botId}) has no instance. Status: ${botData.status}`)
      return NextResponse.json({ error: 'Bot not connected' }, { status: 404 })
    }
    
    // Allow control if bot is connecting or online (not just online)
    if (botData.status === 'offline') {
      console.log(`Control failed: Bot ${botData.username} is offline`)
      return NextResponse.json({ error: 'Bot is offline' }, { status: 404 })
    }
    
    console.log(`Executing action '${action}' for bot ${botData.username} (status: ${botData.status})`)

    // Execute action
    try {
      switch (action) {
        case 'walk':
          bot.setControlState('forward', true)
          await prisma.bot.update({
            where: { id: botId },
            data: { behavior: 'walking' }
          })
          setTimeout(async () => {
            bot.setControlState('forward', false)
            await prisma.bot.update({
              where: { id: botId },
              data: { behavior: 'idle' }
            }).catch(() => {})
          }, 3000)
          break

        case 'jump':
          bot.setControlState('jump', true)
          await prisma.bot.update({
            where: { id: botId },
            data: { behavior: 'jumping' }
          })
          setTimeout(async () => {
            bot.setControlState('jump', false)
            await prisma.bot.update({
              where: { id: botId },
              data: { behavior: 'idle' }
            }).catch(() => {})
          }, 100)
          break

        case 'stop':
          bot.clearControlStates()
          await prisma.bot.update({
            where: { id: botId },
            data: { behavior: 'idle' }
          })
          break

        case 'look_around':
          const randomYaw = Math.random() * Math.PI * 2
          bot.look(randomYaw, 0, true)
          break

        default:
          return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
      }

      console.log(`Bot ${botData.username} executed action: ${action}`)
      return NextResponse.json({ success: true, action })
    } catch (error: any) {
      console.error(`Failed to execute bot action:`, error.message)
      return NextResponse.json({ error: 'Failed to control bot' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to control bot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
