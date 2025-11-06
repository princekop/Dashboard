import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { pterodactylService } from '@/lib/pterodactyl'

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

interface ModrinthSearchResult {
  hits: Array<{
    project_id: string
    slug: string
    title: string
    description: string
    categories: string[]
    versions: string[]
    downloads: number
    project_type: string
  }>
}

interface ModrinthVersion {
  id: string
  version_number: string
  name: string
  game_versions: string[]
  loaders: string[]
  files: Array<{
    url: string
    filename: string
    primary: boolean
  }>
}

// Detect server type from files
async function detectServerType(identifier: string, apiKey: string): Promise<{
  type: 'bukkit' | 'paper' | 'spigot' | 'forge' | 'fabric' | 'vanilla' | 'unknown'
  version: string | null
}> {
  try {
    // Check for server jar files
    const files = await pterodactylService.listFiles(identifier, apiKey, '/')
    const fileList = files.data || []
    
    // Check for Paper
    if (fileList.some((f: any) => f.attributes?.name?.toLowerCase().includes('paper'))) {
      return { type: 'paper', version: await extractVersion(fileList, 'paper') }
    }
    
    // Check for Spigot
    if (fileList.some((f: any) => f.attributes?.name?.toLowerCase().includes('spigot'))) {
      return { type: 'spigot', version: await extractVersion(fileList, 'spigot') }
    }
    
    // Check for Bukkit
    if (fileList.some((f: any) => f.attributes?.name?.toLowerCase().includes('bukkit'))) {
      return { type: 'bukkit', version: await extractVersion(fileList, 'bukkit') }
    }
    
    // Check for Forge (has mods folder)
    if (fileList.some((f: any) => f.attributes?.name?.toLowerCase() === 'mods' && f.attributes?.is_file === false)) {
      return { type: 'forge', version: await extractVersion(fileList, 'forge') }
    }
    
    // Check for Fabric
    if (fileList.some((f: any) => f.attributes?.name?.toLowerCase().includes('fabric'))) {
      return { type: 'fabric', version: await extractVersion(fileList, 'fabric') }
    }
    
    return { type: 'unknown', version: null }
  } catch (error: any) {
    console.error('Failed to detect server type:', error?.response?.status, error?.message)
    
    if (error?.response?.status === 401) {
      throw new Error('Authentication failed. Please check your Pterodactyl API key configuration.')
    }
    
    return { type: 'unknown', version: null }
  }
}

async function extractVersion(files: any[], serverType: string): Promise<string | null> {
  try {
    const jarFile = files.find((f: any) => 
      f.attributes?.name?.toLowerCase().includes(serverType) && 
      f.attributes?.name?.endsWith('.jar')
    )
    
    if (jarFile) {
      const filename = jarFile.attributes.name
      // Extract version like "1.20.1" from "paper-1.20.1-196.jar"
      const versionMatch = filename.match(/(\d+\.\d+(?:\.\d+)?)/)?.[1]
      return versionMatch || null
    }
  } catch {
    return null
  }
  return null
}

// Search Modrinth for plugins/mods
async function searchModrinth(query: string, serverType: string, version: string | null): Promise<any[]> {
  try {
    const facets = []
    
    // Determine project type based on server
    if (['paper', 'spigot', 'bukkit'].includes(serverType)) {
      facets.push(['project_type:plugin'])
    } else if (['forge', 'fabric'].includes(serverType)) {
      facets.push(['project_type:mod'])
    }
    
    // Add version filter if available
    if (version) {
      facets.push([`versions:${version}`])
    }
    
    const response = await axios.get<ModrinthSearchResult>('https://api.modrinth.com/v2/search', {
      params: {
        query,
        limit: 5,
        facets: JSON.stringify(facets)
      }
    })
    
    return response.data.hits
  } catch (error) {
    console.error('Modrinth search failed:', error)
    return []
  }
}

// Get download link for a mod/plugin
async function getDownloadUrl(projectId: string, serverType: string, version: string | null): Promise<string | null> {
  try {
    const response = await axios.get<ModrinthVersion[]>(
      `https://api.modrinth.com/v2/project/${projectId}/version`
    )
    
    const versions = response.data
    
    // Find compatible version
    let compatibleVersion = versions.find(v => {
      const matchesLoader = v.loaders.some(l => 
        l.toLowerCase() === serverType || 
        (serverType === 'paper' && ['paper', 'spigot', 'bukkit'].includes(l.toLowerCase()))
      )
      const matchesGameVersion = !version || v.game_versions.includes(version)
      return matchesLoader && matchesGameVersion
    })
    
    // If no exact match, try first available
    if (!compatibleVersion && versions.length > 0) {
      compatibleVersion = versions[0]
    }
    
    if (compatibleVersion) {
      const primaryFile = compatibleVersion.files.find(f => f.primary) || compatibleVersion.files[0]
      return primaryFile?.url || null
    }
  } catch (error) {
    console.error('Failed to get download URL:', error)
  }
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const adminApiKey = process.env.PTERODACTYL_CLIENT_KEY
    if (!adminApiKey) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'PTERODACTYL_CLIENT_KEY not configured'
      }, { status: 500 })
    }

    const { request: userRequest } = await request.json()

    console.log(`AI Setup request: "${userRequest}" for server ${server.pterodactylIdentifier}`)
    console.log(`Using AI: ${process.env.GEMINI_API_KEY ? 'Gemini API' : 'Direct Search (No AI)'}`)

    // Step 1: Detect server type and version
    const serverInfo = await detectServerType(server.pterodactylIdentifier, adminApiKey)
    
    if (serverInfo.type === 'unknown') {
      return NextResponse.json({ 
        error: 'Could not detect server type. Please ensure your server is properly set up.',
        serverInfo
      }, { status: 400 })
    }

    // Step 2: Use AI to parse user request
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      // Fallback to direct search if no AI
      const results = await searchModrinth(userRequest, serverInfo.type, serverInfo.version)
      return NextResponse.json({
        serverInfo,
        results: results.slice(0, 3),
        message: 'Found these matches. AI processing not available - using direct search.'
      })
    }

    // Use Gemini to understand request
    const systemPrompt = `You are a Minecraft server setup assistant. Analyze requests for plugin/mod installations.
Server type: ${serverInfo.type}, Version: ${serverInfo.version || 'unknown'}

RULES:
1. For FULL SETUP requests (like "setup lifesteal server", "install all plugins needed", "setup PvP server"), set isFullSetup=true and autoInstall=true
2. For SINGLE plugin requests (like "install EssentialsX"), set isFullSetup=false and autoInstall=false
3. Always include 4-8 relevant plugins for full setups

Respond with ONLY this JSON format, no additional text:
{
  "isFullSetup": true,
  "setupType": "lifesteal",
  "plugins": ["LifeStealCore", "EssentialsX", "Vault", "LuckPerms", "WorldEdit", "WorldGuard"],
  "needsRestart": true,
  "autoInstall": true
}

PLUGIN RECOMMENDATIONS:
- Lifesteal: LifeStealCore, EssentialsX, Vault, LuckPerms, WorldEdit, WorldGuard, ChestShop
- PvP: KitPvP, EssentialsX, Vault, LuckPerms, CombatLogX, WorldGuard
- Survival: EssentialsX, Vault, LuckPerms, WorldEdit, WorldGuard, GriefPrevention, ChestShop
- Skyblock: BentoBox, EssentialsX, Vault, LuckPerms`

    let aiResponse
    try {
      console.log('Calling Gemini API with gemini-2.0-flash...')
      aiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser request: ${userRequest}\n\nIMPORTANT: Respond with ONLY valid JSON, no additional text or markdown.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log('Gemini API response received')
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError?.response?.status, apiError?.response?.data || apiError?.message)
      
      // Check if it's an invalid API key or quota issue
      if (apiError?.response?.status === 400 || apiError?.response?.status === 404) {
        console.error('Gemini API key may be invalid or model not available. Falling back to direct search.')
      }
      
      // Fallback to direct search
      const results = await searchModrinth(userRequest, serverInfo.type, serverInfo.version)
      return NextResponse.json({
        serverInfo,
        results: results.slice(0, 3),
        message: 'AI service unavailable - using direct search.',
        aiError: apiError?.response?.data?.error?.message || 'Gemini API error'
      })
    }

    // Extract text from Gemini response
    const geminiText = aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!geminiText) {
      console.error('Invalid Gemini response structure:', JSON.stringify(aiResponse.data))
      // Fallback to direct search
      const results = await searchModrinth(userRequest, serverInfo.type, serverInfo.version)
      return NextResponse.json({
        serverInfo,
        results: results.slice(0, 3),
        message: 'AI processing failed - using direct search.'
      })
    }
    
    // Remove markdown code blocks if present
    const cleanedText = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let aiParsed
    try {
      aiParsed = JSON.parse(cleanedText)
      console.log('AI parsed response:', aiParsed)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', cleanedText)
      // Fallback to direct search
      const results = await searchModrinth(userRequest, serverInfo.type, serverInfo.version)
      return NextResponse.json({
        serverInfo,
        results: results.slice(0, 3),
        message: 'AI parsing failed - using direct search.'
      })
    }

    // Step 3: Search Modrinth for all plugins
    const allResults: any[] = []
    const pluginsToSearch = aiParsed.plugins || [aiParsed.searchQuery]
    
    for (const pluginName of pluginsToSearch) {
      const results = await searchModrinth(pluginName, serverInfo.type, serverInfo.version)
      if (results.length > 0) {
        // Add the best match for each plugin
        allResults.push({
          ...results[0],
          searchQuery: pluginName
        })
      }
    }

    if (allResults.length === 0) {
      return NextResponse.json({
        error: 'No matching plugins/mods found',
        serverInfo,
        searchQuery: pluginsToSearch.join(', ')
      }, { status: 404 })
    }

    return NextResponse.json({
      serverInfo,
      isFullSetup: aiParsed.isFullSetup || false,
      setupType: aiParsed.setupType,
      needsRestart: aiParsed.needsRestart,
      autoInstall: aiParsed.autoInstall || false,
      results: allResults,
      message: aiParsed.isFullSetup 
        ? `Found ${allResults.length} plugins for ${aiParsed.setupType} setup. Ready to auto-install.`
        : `Found ${allResults.length} matches`
    })

  } catch (error: any) {
    console.error('AI setup failed:', error?.message || error)
    
    // Check for specific error types
    if (error?.message?.includes('Authentication failed')) {
      return NextResponse.json({ 
        error: 'Authentication Error',
        details: 'Failed to authenticate with Pterodactyl. Please contact an administrator.'
      }, { status: 401 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error?.message || 'An unexpected error occurred'
    }, { status: 500 })
  }
}
