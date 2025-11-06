import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import axios from 'axios'
import { botInstances, mineflayer, calculateExpiryTime } from '@/lib/bot-store'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user || !user.devMode) {
      return NextResponse.json({ error: 'Developer mode required' }, { status: 403 })
    }

    const { id } = await params
    const server = await prisma.server.findUnique({
      where: { id }
    })

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 })
    }

    if (server.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get bots for this server from database
    const bots = await prisma.bot.findMany({
      where: { serverId: id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ 
      bots: bots.map(bot => ({
        id: bot.id,
        serverId: bot.serverId,
        username: bot.username,
        status: bot.status,
        x: bot.x,
        y: bot.y,
        z: bot.z,
        health: bot.health,
        food: bot.food,
        behavior: bot.behavior,
        duration: bot.duration,
        aiEnabled: bot.aiEnabled,
        expiresAt: bot.expiresAt,
        createdAt: bot.createdAt
      }))
    })
  } catch (error) {
    console.error('Failed to list bots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken()
    if (!user || !user.devMode) {
      return NextResponse.json({ error: 'Developer mode required' }, { status: 403 })
    }

    const adminApiKey = process.env.PTERODACTYL_CLIENT_KEY
    if (!adminApiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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

    const body = await request.json()
    const { botCount, botPrefix, duration, aiEnabled } = body

    if (!botCount || botCount < 1 || botCount > 100) {
      return NextResponse.json({ error: 'Invalid bot count' }, { status: 400 })
    }

    // Get Pterodactyl settings
    const settings = await prisma.pterodactylSettings.findFirst({
      where: { isActive: true }
    })

    if (!settings) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 500 })
    }

    // Get server allocations to find IP and port
    let serverIp = 'localhost'
    let serverPort = 25565

    try {
      const allocRes = await axios.get(
        `${settings.panelUrl}/api/client/servers/${server.pterodactylIdentifier}/network/allocations`,
        {
          headers: {
            'Authorization': `Bearer ${adminApiKey}`,
            'Accept': 'application/json'
          }
        }
      )

      const allocations = allocRes.data.data || []
      if (allocations.length > 0) {
        const primaryAlloc = allocations.find((a: any) => a.attributes?.is_default) || allocations[0]
        const attrs = primaryAlloc.attributes || primaryAlloc
        serverIp = attrs.ip_alias || attrs.ip || 'localhost'
        serverPort = attrs.port || 25565
      }
    } catch (error) {
      console.error('Failed to get allocations, using defaults:', error)
    }

    // Create bots with delay to avoid throttling
    const createdBots = []
    const expiresAt = calculateExpiryTime(duration)
    
    console.log(`Creating ${botCount} bots with 5 second delay between each...`)
    
    for (let i = 1; i <= botCount; i++) {
      const username = `${botPrefix}${i}`
      
      console.log(`[${i}/${botCount}] Creating bot ${username}...`)
      
      // Add extra delay for first bot to ensure server is ready
      if (i === 1) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      // Create bot in database
      const botData = await prisma.bot.create({
        data: {
          serverId: id,
          username,
          status: 'connecting',
          serverIp,
          serverPort,
          x: 0,
          y: 64,
          z: 0,
          health: 100,
          food: 100,
          behavior: aiEnabled ? 'ai-controlled' : 'idle',
          aiEnabled,
          duration,
          expiresAt
        }
      })

      // Create actual Mineflayer bot if available
      if (mineflayer) {
        try {
          console.log(`Creating bot ${username} connecting to ${serverIp}:${serverPort}`)
          
          const bot = mineflayer.createBot({
            host: serverIp,
            port: serverPort,
            username: username,
            auth: 'offline', // Cracked/offline mode
            version: false // Auto-detect version
          })

          // Store bot instance
          botInstances.set(botData.id, bot)
          
          bot.on('login', () => {
            console.log(`Bot ${username} logged in successfully`)
          })

          bot.on('spawn', async () => {
            console.log(`Bot ${username} spawned - updating status to online`)
            try {
              await prisma.bot.update({
                where: { id: botData.id },
                data: {
                  status: 'online',
                  x: bot.entity ? Number(bot.entity.position.x) : 0,
                  y: bot.entity ? Number(bot.entity.position.y) : 64,
                  z: bot.entity ? Number(bot.entity.position.z) : 0,
                  health: Number(bot.health) || 100,
                  food: Number(bot.food) || 100
                }
              })
              console.log(`Bot ${username} status updated to online in database`)
            } catch (err) {
              console.error(`Failed to update bot ${username} status:`, err)
            }
          })

          bot.on('health', async () => {
            try {
              await prisma.bot.update({
                where: { id: botData.id },
                data: {
                  health: Number(bot.health) || 100,
                  food: Number(bot.food) || 100
                }
              })
            } catch (err) {
              console.error(`Failed to update bot health:`, err)
            }
          })

          bot.on('move', async () => {
            if (bot.entity) {
              try {
                await prisma.bot.update({
                  where: { id: botData.id },
                  data: {
                    x: Number(bot.entity.position.x) || 0,
                    y: Number(bot.entity.position.y) || 64,
                    z: Number(bot.entity.position.z) || 0
                  }
                })
              } catch (err) {
                // Ignore move update errors to avoid spam
              }
            }
          })

          bot.on('kicked', async (reason: string) => {
            console.log(`Bot ${username} was kicked: ${reason}`)
            
            try {
              await prisma.bot.update({
                where: { id: botData.id },
                data: { status: 'offline' }
              })
            } catch (err) {
              console.error(`Failed to update bot status:`, err)
            }
            
            botInstances.delete(botData.id)
          })

          bot.on('error', async (err: Error) => {
            console.error(`Bot ${username} error:`, err.message)
            try {
              await prisma.bot.update({
                where: { id: botData.id },
                data: { status: 'offline' }
              })
            } catch (error) {
              console.error(`Failed to update bot status:`, error)
            }
          })

          bot.on('end', async () => {
            console.log(`Bot ${username} disconnected`)
            try {
              await prisma.bot.update({
                where: { id: botData.id },
                data: { status: 'offline' }
              })
            } catch (err) {
              console.error(`Failed to update bot status:`, err)
            }
            botInstances.delete(botData.id)
          })

          // AI behavior - realistic player simulation
          if (aiEnabled) {
            let aiInterval: NodeJS.Timeout | null = null
            let isAIActive = false
            
            bot.on('spawn', () => {
              console.log(`AI enabled for ${username}, starting autonomous behavior...`)
              
              // Clear any existing interval
              if (aiInterval) clearInterval(aiInterval)
              
              // Wait 5 seconds after spawn before starting AI to ensure everything is ready
              setTimeout(() => {
                isAIActive = true
              
              // AI behavior loop - executes every 3-7 seconds
              const performAIAction = async () => {
                // Check if bot instance still exists
                if (!bot || !isAIActive) {
                  if (aiInterval) clearInterval(aiInterval)
                  return
                }
                
                // Check database status (but don't fail if query fails)
                try {
                  const dbBot = await prisma.bot.findUnique({ where: { id: botData.id } })
                  if (!dbBot || dbBot.status === 'offline') {
                    if (aiInterval) clearInterval(aiInterval)
                    return
                  }
                } catch (err) {
                  // Continue anyway - don't stop AI if database query fails
                  console.error(`AI status check failed for ${username}, continuing...`)
                }
                
                try {
                  const action = Math.random()
                  
                  if (action < 0.4) {
                    // 40% chance: Walk forward
                    const walkDuration = 1000 + Math.random() * 3000 // 1-4 seconds
                    bot.setControlState('forward', true)
                    
                    await prisma.bot.update({
                      where: { id: botData.id },
                      data: { behavior: 'walking' }
                    }).catch(() => {})
                    
                    setTimeout(async () => {
                      if (bot) {
                        bot.setControlState('forward', false)
                        await prisma.bot.update({
                          where: { id: botData.id },
                          data: { behavior: 'idle' }
                        }).catch(() => {})
                      }
                    }, walkDuration)
                    
                  } else if (action < 0.6) {
                    // 20% chance: Look around
                    const randomYaw = Math.random() * Math.PI * 2
                    const randomPitch = (Math.random() - 0.5) * Math.PI / 4
                    bot.look(randomYaw, randomPitch, true)
                    
                    await prisma.bot.update({
                      where: { id: botData.id },
                      data: { behavior: 'looking' }
                    }).catch(() => {})
                    
                    setTimeout(async () => {
                      await prisma.bot.update({
                        where: { id: botData.id },
                        data: { behavior: 'idle' }
                      }).catch(() => {})
                    }, 500)
                    
                  } else if (action < 0.7) {
                    // 10% chance: Jump
                    bot.setControlState('jump', true)
                    
                    await prisma.bot.update({
                      where: { id: botData.id },
                      data: { behavior: 'jumping' }
                    }).catch(() => {})
                    
                    setTimeout(async () => {
                      if (bot) {
                        bot.setControlState('jump', false)
                        await prisma.bot.update({
                          where: { id: botData.id },
                          data: { behavior: 'idle' }
                        }).catch(() => {})
                      }
                    }, 100)
                    
                  } else if (action < 0.8) {
                    // 10% chance: Strafe (walk sideways)
                    const direction = Math.random() > 0.5 ? 'left' : 'right'
                    bot.setControlState(direction, true)
                    
                    await prisma.bot.update({
                      where: { id: botData.id },
                      data: { behavior: `strafing ${direction}` }
                    }).catch(() => {})
                    
                    setTimeout(async () => {
                      if (bot) {
                        bot.setControlState(direction, false)
                        await prisma.bot.update({
                          where: { id: botData.id },
                          data: { behavior: 'idle' }
                        }).catch(() => {})
                      }
                    }, 1000)
                    
                  } else {
                    // 20% chance: Stand still (idle)
                    bot.clearControlStates()
                    await prisma.bot.update({
                      where: { id: botData.id },
                      data: { behavior: 'idle' }
                    }).catch(() => {})
                  }
                  
                } catch (error) {
                  console.error(`AI error for ${username}:`, error)
                }
              }
              
              // Start AI loop with random intervals (3-7 seconds)
              const runAILoop = () => {
                if (!isAIActive) return
                performAIAction()
                const nextDelay = 3000 + Math.random() * 4000 // 3-7 seconds
                aiInterval = setTimeout(runAILoop, nextDelay)
              }
              
              // Start first action after 2 seconds
              setTimeout(runAILoop, 2000)
              }, 5000) // End of 5 second wait after spawn
            })
            
            // Clean up AI on disconnect
            bot.on('end', () => {
              isAIActive = false
              if (aiInterval) {
                clearInterval(aiInterval)
                aiInterval = null
              }
            })
          }

        } catch (error: any) {
          console.error(`Failed to create bot ${username}:`, error.message)
          await prisma.bot.update({
            where: { id: botData.id },
            data: { status: 'offline' }
          }).catch(() => {})
        }
      } else {
        // Simulate bot if mineflayer not available
        setTimeout(async () => {
          await prisma.bot.update({
            where: { id: botData.id },
            data: {
              status: 'online',
              x: Math.random() * 100,
              z: Math.random() * 100
            }
          }).catch(() => {})
        }, 2000)
      }

      createdBots.push(botData)
      

      // Delay between bot creations to avoid server throttling (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    return NextResponse.json({ 
      success: true,
      created: createdBots.length,
      bots: createdBots,
      serverIp,
      serverPort,
      mineflayerAvailable: !!mineflayer,
      message: mineflayer 
        ? `${createdBots.length} bot(s) created and connecting to ${serverIp}:${serverPort}${aiEnabled ? ' with AI enabled' : ''}` 
        : `${createdBots.length} bot(s) created in simulation mode (mineflayer not installed)`
    })
  } catch (error: any) {
    console.error('Failed to create bots:', error)
    return NextResponse.json({ 
      error: 'Failed to create bots',
      details: error.message 
    }, { status: 500 })
  }
}

function parseDuration(duration: string): number {
  const map: { [key: string]: number } = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }
  return map[duration] || 0
}
