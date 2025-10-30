import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const upsells = await prisma.upsell.findMany({
      where: { isActive: true },
      take: 3
    })

    return NextResponse.json({ upsells })
  } catch (error) {
    console.error('Failed to fetch upsells:', error)
    return NextResponse.json({ upsells: [] })
  }
}
