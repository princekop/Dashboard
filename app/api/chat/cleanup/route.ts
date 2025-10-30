import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

// This endpoint should be called by a cron job
export async function POST(request: NextRequest) {
  try {
    // Get all chat messages with media older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const expiredMessages = await prisma.chatMessage.findMany({
      where: {
        mediaUrl: { not: null },
        createdAt: { lt: twentyFourHoursAgo }
      }
    })

    let deletedCount = 0
    let errorCount = 0

    // Delete files and clear media URLs
    for (const message of expiredMessages) {
      if (message.mediaUrl) {
        try {
          // Delete the physical file
          const filepath = join(process.cwd(), 'public', message.mediaUrl)
          if (existsSync(filepath)) {
            await unlink(filepath)
          }

          // Update message to remove media references
          await prisma.chatMessage.update({
            where: { id: message.id },
            data: {
              mediaUrl: null,
              mediaType: null,
              expiresAt: null
            }
          })

          deletedCount++
        } catch (error) {
          console.error(`Failed to delete media for message ${message.id}:`, error)
          errorCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      errorCount,
      message: `Cleaned up ${deletedCount} expired media files`
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup expired media' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
