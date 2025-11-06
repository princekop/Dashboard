import { PrismaClient } from '@prisma/client'
import { botInstances } from './bot-store'

const prisma = new PrismaClient()

// Cleanup expired bots every minute
let cleanupInterval: NodeJS.Timeout | null = null

export function startBotCleanup() {
  if (cleanupInterval) return
  
  console.log('🤖 Bot cleanup service started')
  
  cleanupInterval = setInterval(async () => {
    try {
      const now = new Date()
      
      // Find expired bots
      const expiredBots = await prisma.bot.findMany({
        where: {
          expiresAt: {
            lte: now
          }
        }
      })
      
      console.log(`Found ${expiredBots.length} expired bots`)
      
      // Disconnect and delete each expired bot
      for (const bot of expiredBots) {
        const botInstance = botInstances.get(bot.id)
        if (botInstance && typeof botInstance.quit === 'function') {
          botInstance.quit()
          console.log(`Disconnected expired bot: ${bot.username}`)
        }
        botInstances.delete(bot.id)
        
        await prisma.bot.delete({
          where: { id: bot.id }
        })
      }
      
      if (expiredBots.length > 0) {
        console.log(`Cleaned up ${expiredBots.length} expired bot(s)`)
      }
    } catch (error) {
      console.error('Bot cleanup error:', error)
    }
  }, 60000) // Every minute
}

export function stopBotCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
    console.log('Bot cleanup service stopped')
  }
}

// Auto-start cleanup service
if (typeof window === 'undefined') {
  startBotCleanup()
}
