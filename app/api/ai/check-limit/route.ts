import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user's AI credit
    let credit = await prisma.aICredit.findUnique({
      where: { userId: user.id }
    }).catch(() => null)

    if (!credit) {
      credit = await prisma.aICredit.create({
        data: {
          userId: user.id,
          dailyLimit: 50,
          purchasedLimit: 0,
          lastReset: new Date()
        }
      }).catch(() => null)
    }
    
    if (!credit) {
      return NextResponse.json({ error: 'Failed to get AI credit info' }, { status: 500 })
    }

    // Check if we need to reset daily limit (every 24 hours)
    const now = new Date()
    const hoursSinceReset = (now.getTime() - credit.lastReset.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceReset >= 24) {
      // Reset daily count
      await prisma.aICredit.update({
        where: { userId: user.id },
        data: { lastReset: now }
      }).catch(() => {})
      
      // Delete old requests (older than 24 hours)
      await prisma.aIRequest.deleteMany({
        where: {
          userId: user.id,
          createdAt: {
            lt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        }
      })
    }

    // Count today's requests
    const requestCount = await prisma.aIRequest.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      }
    })

    const totalLimit = credit.dailyLimit + credit.purchasedLimit
    const remaining = Math.max(0, totalLimit - requestCount)
    const canRequest = remaining > 0

    return NextResponse.json({
      canRequest,
      used: requestCount,
      total: totalLimit,
      remaining,
      dailyLimit: credit.dailyLimit,
      purchasedLimit: credit.purchasedLimit
    })
  } catch (error) {
    console.error('Failed to check AI limit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await request.json()

    // Check limit first
    const limitCheck = await GET(request)
    const limitData = await limitCheck.json()

    if (!limitData.canRequest) {
      return NextResponse.json({ 
        error: 'Daily limit reached',
        message: `You've reached your daily limit of ${limitData.total} AI requests. Purchase additional credits to continue.`,
        limit: true
      }, { status: 429 })
    }

    // Record the request
    await prisma.aIRequest.create({
      data: {
        userId: user.id,
        type: type || 'console'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to track AI request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
