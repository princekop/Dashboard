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

export async function DELETE(
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

    // Get bot from database
    const bot = await prisma.bot.findUnique({
      where: { id: botId }
    })
    
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    
    // Disconnect Mineflayer bot if it exists
    const botInstance = botInstances.get(botId)
    if (botInstance && typeof botInstance.quit === 'function') {
      botInstance.quit()
      console.log(`Bot ${bot.username} disconnected`)
    }
    
    // Remove from instances and database
    botInstances.delete(botId)
    await prisma.bot.delete({
      where: { id: botId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete bot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
