import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isAdmin: true }
    })
    return user?.isAdmin ? decoded.userId : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const adminId = await checkAdmin()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { panelUrl, apiKey } = await request.json()

    if (!panelUrl || !apiKey) {
      return NextResponse.json(
        { message: 'Panel URL and API Key are required' },
        { status: 400 }
      )
    }

    // Test connection by fetching users
    const response = await axios.get(`${panelUrl}/api/application/users`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 5000
    })

    if (response.status === 200) {
      return NextResponse.json({
        success: true,
        message: 'Connection successful! Pterodactyl panel is reachable.'
      })
    }

    return NextResponse.json(
      { message: 'Connection failed. Please check your credentials.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Pterodactyl test failed:', error)

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { message: 'Connection timeout. Please check the panel URL.' },
        { status: 500 }
      )
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return NextResponse.json(
        { message: 'Invalid API Key. Please check your credentials.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { message: 'Connection failed. Please check your panel URL and API Key.' },
      { status: 500 }
    )
  }
}
