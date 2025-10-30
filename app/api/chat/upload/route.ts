import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB

async function getUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (images and videos only)
    const fileType = file.type
    const isImage = fileType.startsWith('image/')
    const isVideo = fileType.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Only images and videos are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 1GB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 1GB' },
        { status: 400 }
      )
    }

    // Create chat media directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filename = `chat-${userId}-${timestamp}.${ext}`
    const filepath = join(uploadDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const mediaUrl = `/uploads/chat/${filename}`
    const mediaType = isImage ? 'image' : 'video'

    return NextResponse.json({
      success: true,
      mediaUrl,
      mediaType,
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('Chat upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
