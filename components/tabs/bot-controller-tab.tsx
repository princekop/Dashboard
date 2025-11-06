"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Plus, Trash2, Play, Square, Users, Wifi, Activity, Brain, Loader2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'

interface BotInstance {
  id: string
  username: string
  status: 'online' | 'offline' | 'connecting'
  x: number
  y: number
  z: number
  health: number
  food: number
  behavior: string
  duration: string
}

interface BotControllerTabProps {
  serverId: string
}

export function BotControllerTab({ serverId }: BotControllerTabProps) {
  const [bots, setBots] = useState<BotInstance[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddBot, setShowAddBot] = useState(false)
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [botCount, setBotCount] = useState(1)
  const [botPrefix, setBotPrefix] = useState('Bot')
  const [duration, setDuration] = useState('never')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedBot, setSelectedBot] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)

  useEffect(() => {
    loadBots()
    loadServerInfo()
    const interval = setInterval(loadBots, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [serverId])

  const loadServerInfo = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/info`)
      if (res.ok) {
        const data = await res.json()
        setServerInfo(data)
      }
    } catch (error) {
      console.error('Failed to load server info:', error)
    }
  }

  const loadBots = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/bots`)
      if (res.ok) {
        const data = await res.json()
        setBots(data.bots || [])
      }
    } catch (error) {
      console.error('Failed to load bots:', error)
    }
  }

  const createBots = async () => {
    if (!serverInfo) {
      alert('Server information not loaded')
      return
    }

    setPreparing(true)
    setCreating(true)

    try {
      // Step 1: Check and enable cracked mode if needed
      const prepareRes = await fetch(`/api/servers/${serverId}/bots/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!prepareRes.ok) {
        const error = await prepareRes.json()
        throw new Error(error.error || 'Failed to prepare server')
      }

      const prepareData = await prepareRes.json()
      setPreparing(false)

      // Step 2: Wait for server to restart only if needed
      if (prepareData.needsRestart) {
        alert('Server is restarting to enable cracked mode. Please wait 15 seconds...')
        await new Promise(resolve => setTimeout(resolve, 15000))
      } else if (prepareData.alreadyConfigured) {
        // Server already ready, no wait needed
        console.log('Server already configured, proceeding immediately')
      }

      // Step 3: Create bots
      const res = await fetch(`/api/servers/${serverId}/bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botCount,
          botPrefix,
          duration,
          aiEnabled
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create bots')
      }

      const data = await res.json()
      
      if (data.mineflayerAvailable) {
        const estimatedTime = Math.ceil(data.created * 5 / 60)
        alert(`✓ Bot creation started!\n\n${data.created} bot(s) will join ${data.serverIp}:${data.serverPort}\n\nNote: Bots join with 5-second delay to prevent server throttling.\nEstimated time: ${estimatedTime} minute(s)\n\nCheck the bot list below for live status.`)
      } else {
        alert(`⚠️ Mineflayer not installed!\n\nBots created in simulation mode. To enable real bot connections, install mineflayer:\nnpm install mineflayer`)
      }
      
      setShowAddBot(false)
      loadBots()
    } catch (error: any) {
      console.error('Failed to create bots:', error)
      alert(error.message || 'Failed to create bots')
    } finally {
      setCreating(false)
      setPreparing(false)
    }
  }

  const deleteBot = async (botId: string) => {
    if (!confirm('Disconnect this bot?')) return

    try {
      await fetch(`/api/servers/${serverId}/bots/${botId}`, {
        method: 'DELETE'
      })
      loadBots()
    } catch (error) {
      console.error('Failed to delete bot:', error)
    }
  }

  const controlBot = async (botId: string, action: string) => {
    try {
      const res = await fetch(`/api/servers/${serverId}/bots/${botId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (!res.ok) {
        if (res.status === 404) {
          console.error('Bot not found or not connected')
          loadBots() // Refresh list
          return
        }
        throw new Error('Failed to control bot')
      }
      
      loadBots()
    } catch (error) {
      console.error('Failed to control bot:', error)
    }
  }

  const controlAllBots = async (action: string) => {
    try {
      await Promise.all(bots.map(bot => 
        fetch(`/api/servers/${serverId}/bots/${bot.id}/control`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        })
      ))
      loadBots()
    } catch (error) {
      console.error('Failed to control all bots:', error)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Bot Controller
              {bots.length > 0 && (
                <Badge variant="outline">{bots.length} Active</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {bots.length > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={() => controlAllBots('walk')}>
                    <Play className="h-4 w-4 mr-2" />
                    Walk All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => controlAllBots('stop')}>
                    <Square className="h-4 w-4 mr-2" />
                    Stop All
                  </Button>
                </>
              )}
              <Button size="sm" onClick={() => setShowAddBot(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bots
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && bots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading bots...
            </div>
          ) : bots.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No bots connected</p>
              <Button onClick={() => setShowAddBot(true)}>
                Create Your First Bot
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bots.map((bot) => (
                <Card key={bot.id} className="border-primary/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`h-3 w-3 rounded-full ${
                              bot.status === 'online' ? 'bg-green-500' :
                              bot.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                              'bg-red-500'
                            }`} />
                          </div>
                          <h3 className="font-semibold">{bot.username}</h3>
                          <Badge variant={bot.status === 'online' ? 'default' : 'secondary'}>
                            {bot.status}
                          </Badge>
                          {bot.behavior && bot.behavior !== 'idle' && (
                            <Badge variant="outline" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              {bot.behavior}
                            </Badge>
                          )}
                          {bot.behavior === 'ai-controlled' && (
                            <Badge variant="default" className="text-xs bg-purple-600">
                              <Brain className="h-3 w-3 mr-1" />
                              AI Active
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Activity className="h-4 w-4" />
                            <span>Health: {bot.health}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Food: {bot.food}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Wifi className="h-4 w-4" />
                            <span>X: {bot.x.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Wifi className="h-4 w-4" />
                            <span>Z: {bot.z.toFixed(1)}</span>
                          </div>
                        </div>

                        {bot.status === 'online' ? (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => controlBot(bot.id, 'walk')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Walk
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => controlBot(bot.id, 'jump')}
                            >
                              Jump
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => controlBot(bot.id, 'stop')}
                            >
                              <Square className="h-3 w-3 mr-1" />
                              Stop
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Bot is {bot.status}. Control unavailable.
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBot(bot.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bots Dialog */}
      <Dialog open={showAddBot} onOpenChange={setShowAddBot}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Bots</DialogTitle>
            <DialogDescription>
              Configure and spawn bots to your Minecraft server
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {serverInfo && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-semibold mb-2">Server Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {serverInfo.name}</p>
                  <p><span className="text-muted-foreground">Identifier:</span> <code className="text-xs">{serverInfo.pterodactylIdentifier}</code></p>
                  {serverInfo.serverIp && (
                    <p><span className="text-muted-foreground">IP:</span> <code>{serverInfo.serverIp}:{serverInfo.serverPort || 25565}</code></p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Number of Bots (1-100)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[botCount]}
                  onValueChange={(val) => setBotCount(val[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-2xl font-bold w-12 text-center">{botCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Server capacity check will be performed before creation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bot Username Prefix</Label>
              <Input
                placeholder="Bot, Byte, Player..."
                value={botPrefix}
                onChange={(e) => setBotPrefix(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Bots will be named: {botPrefix}1, {botPrefix}2, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="never">Never Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div>
                <p className="font-semibold">AI Control</p>
                <p className="text-sm text-muted-foreground">
                  Bots will behave like normal players
                </p>
              </div>
              <Button
                variant={aiEnabled ? "default" : "outline"}
                onClick={() => setAiEnabled(!aiEnabled)}
              >
                <Brain className="h-4 w-4 mr-2" />
                {aiEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ℹ️ <strong>Note:</strong> Server will restart if cracked mode is not enabled. This is required for bots to join.
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ⏱️ <strong>Connection Delay:</strong> Bots join with a 5-second delay between each to prevent server throttling.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBot(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createBots} disabled={creating || !serverInfo}>
              {preparing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing Server...
                </>
              ) : creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Bots...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create & Join {botCount} Bot{botCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
