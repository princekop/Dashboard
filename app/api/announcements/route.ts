import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET active announcements (public)
export async function GET(request: NextRequest) {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5 // Only show top 5 announcements
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
