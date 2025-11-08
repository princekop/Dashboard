"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal, Send, Trash2, Play, Square, RotateCw, Power, AlertTriangle, ChevronDown, ChevronUp, Bot, X, Loader2, Cpu, HardDrive, MemoryStick } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { parseAnsiLine, detectLogLevel } from '@/lib/ansi-parser'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface ConsoleTabProps {
  serverId: string
  serverIdentifier: string
}

export function ConsoleTabEnhanced({ serverId, serverIdentifier }: ConsoleTabProps) {
  const [logs, setLogs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `console-logs-${serverId}`
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [command, setCommand] = useState('')
  const [serverState, setServerState] = useState<'offline' | 'starting' | 'running' | 'stopping'>('offline')
  const [isConnected, setIsConnected] = useState(false)
  const [errors, setErrors] = useState<{type: string, message: string, timestamp: string, fullLog: string}[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false)
  const [aiLimit, setAiLimit] = useState({ used: 0, total: 50, remaining: 50, canRequest: true })
  const [resourceStats, setResourceStats] = useState({
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: { percentage: 0 },
    disk: { used: 0, total: 0, percentage: 0 }
  })
  
  const logsEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (typeof window !== 'undefined' && logs.length > 0) {
      const logsToSave = logs.slice(-1000)
      localStorage.setItem(`console-logs-${serverId}`, JSON.stringify(logsToSave))
    }
  }, [logs, serverId])

  useEffect(() => {
    connectWebSocket()
    loadResources()
    checkAILimit()
    
    const resourceInterval = setInterval(loadResources, 3000)
    
    return () => {
      clearInterval(resourceInterval)
      
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [serverId])

  const checkAILimit = async () => {
    try {
      const res = await fetch('/api/ai/check-limit')
      if (res.ok) {
        const data = await res.json()
        setAiLimit(data)
      }
    } catch (error) {
      console.error('Failed to check AI limit:', error)
    }
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const loadResources = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/resources`)
      if (res.ok) {
        const data = await res.json()
        const attrs = data.attributes
        
        if (attrs?.resources && attrs?.limits) {
          setResourceStats({
            memory: {
              used: Math.round(attrs.resources.memory_bytes / 1024 / 1024),
              total: Math.round(attrs.limits.memory / 1024 / 1024),
              percentage: Math.min(100, (attrs.resources.memory_bytes / attrs.limits.memory) * 100)
            },
            cpu: {
              percentage: Math.min(100, attrs.resources.cpu_absolute)
            },
            disk: {
              used: Math.round(attrs.resources.disk_bytes / 1024 / 1024),
              total: Math.round(attrs.limits.disk / 1024 / 1024),
              percentage: Math.min(100, (attrs.resources.disk_bytes / attrs.limits.disk) * 100)
            }
          })
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  const manualReconnect = () => {
    reconnectAttemptsRef.current = 0
    setMaxAttemptsReached(false)
    connectWebSocket()
  }

  const connectWebSocket = async () => {
    if (maxAttemptsReached) return
    if (!serverIdentifier || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setMaxAttemptsReached(true)
      return
    }

    try {
      const res = await fetch(`/api/servers/${serverId}/websocket`)
      if (!res.ok) return

      const wsData = await res.json()
      const ws = new WebSocket(wsData.data.socket)

      ws.addEventListener('open', () => {
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        ws.send(JSON.stringify({ event: 'auth', args: [wsData.data.token] }))
      })

      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.event === 'console output') {
            const lines = message.args[0].split('\n').filter((line: string) => line.trim())
            setLogs(prev => [...prev, ...lines])
            
            lines.forEach((line: string) => {
              if (line.toLowerCase().includes('error') || 
                  line.toLowerCase().includes('exception') ||
                  line.toLowerCase().includes('failed') ||
                  line.toLowerCase().includes('warn')) {
                const errorType = line.toLowerCase().includes('warn') ? 'WARNING' : 'ERROR'
                const timestamp = new Date().toLocaleTimeString()
                setErrors(prev => [...prev, {
                  type: errorType,
                  message: line.substring(0, 100),
                  timestamp,
                  fullLog: line
                }])
              }
            })
          } else if (message.event === 'status') {
            setServerState(message.args[0])
          }
        } catch (e) {
          // Ignore parse errors
        }
      })

      ws.addEventListener('close', () => {
        setIsConnected(false)
        wsRef.current = null
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          setTimeout(connectWebSocket, 3000)
        } else {
          setMaxAttemptsReached(true)
        }
      })

      ws.addEventListener('error', () => {
        // Errors are silently filtered above
      })

      wsRef.current = ws
    } catch (error) {
      setIsConnected(false)
    }
  }

  const sendCommand = async (cmd: string) => {
    if (!cmd.trim()) return
    
    try {
      await fetch(`/api/servers/${serverId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      })
      setCommand('')
    } catch (error) {
      console.error('Failed to send command:', error)
    }
  }

  const sendPowerAction = async (action: string) => {
    try {
      await fetch(`/api/servers/${serverId}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
    } catch (error) {
      console.error('Failed to send power action:', error)
    }
  }

  const askAI = async () => {
    if (!aiInput.trim() || aiLoading) return
    
    // Check AI limit first
    if (!aiLimit.canRequest) {
      alert('You\'ve reached your daily AI request limit. Purchase additional credits to continue.')
      return
    }
    
    const userMessage = aiInput.trim()
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setAiLoading(true)

    try {
      // Track the AI request
      const trackRes = await fetch('/api/ai/check-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'console' })
      })

      if (trackRes.status === 429) {
        const limitData = await trackRes.json()
        setAiMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `⚠️ ${limitData.message}\n\n💳 Purchase 1000 requests for ₹100 to continue using AI assistance.` 
        }])
        checkAILimit() // Refresh limit display
        setAiLoading(false)
        return
      }

      const contextLogs = logs.slice(-50).join('\n')
      const contextErrors = errors.slice(-5).map(e => e.fullLog).join('\n')
      
      const response = await fetch('/api/ai/console-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          logs: contextLogs,
          errors: contextErrors
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        checkAILimit() // Refresh limit after successful request
      } else {
        setAiMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }])
      }
    } catch (error) {
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to get AI response. Please try again.' 
      }])
    } finally {
      setAiLoading(false)
    }
  }

  const clearAIChat = () => {
    setAiMessages([])
    sessionStorage.removeItem(`console-ai-${serverId}`)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'from-green-500 to-emerald-500'
    if (percentage < 75) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  return (
    <div className="space-y-4 p-6">
      {/* Resource Stats Cards - Dark Black Theme with Neon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Memory Card */}
        <Card className="relative overflow-hidden border-cyan-400/30 bg-black/95 shadow-2xl shadow-cyan-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_50%)]" />
          <CardContent className="pt-6 pb-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center ring-2 ring-cyan-400/50 shadow-xl shadow-cyan-500/50 backdrop-blur-sm">
                  <MemoryStick className="h-7 w-7 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Memory</p>
                  <p className="text-2xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                    {resourceStats.memory.used} MB
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold text-white drop-shadow-[0_0_12px_rgba(34,211,238,1)]">
                  {Math.round(resourceStats.memory.percentage)}%
                </p>
                <p className="text-xs text-white/60 font-semibold">
                  / {resourceStats.memory.total} MB
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded-full overflow-hidden bg-black/60 border border-cyan-500/30 shadow-inner">
                <div 
                  className={`h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] transition-all duration-500`}
                  style={{ width: `${resourceStats.memory.percentage}%` }}
                />
              </div>
              <div className="h-1 rounded-full overflow-hidden bg-black/40">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_15px_rgba(34,211,238,1)] transition-all duration-500 animate-pulse"
                  style={{ width: `${resourceStats.memory.percentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CPU Card */}
        <Card className="relative overflow-hidden border-green-400/30 bg-black/95 shadow-2xl shadow-green-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
          <CardContent className="pt-6 pb-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center ring-2 ring-green-400/50 shadow-xl shadow-green-500/50 backdrop-blur-sm">
                  <Cpu className="h-7 w-7 text-green-300 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">CPU Usage</p>
                  <p className="text-2xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
                    {Math.round(resourceStats.cpu.percentage * 10) / 10}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold text-white drop-shadow-[0_0_12px_rgba(34,197,94,1)]">
                  {Math.round(resourceStats.cpu.percentage)}%
                </p>
                <p className="text-xs text-white/60 font-semibold">
                  Real-time
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded-full overflow-hidden bg-black/60 border border-green-500/30 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-green-400 to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.8)] transition-all duration-500"
                  style={{ width: `${resourceStats.cpu.percentage}%` }}
                />
              </div>
              <div className="h-1 rounded-full overflow-hidden bg-black/40">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 shadow-[0_0_15px_rgba(34,197,94,1)] transition-all duration-500 animate-pulse"
                  style={{ width: `${resourceStats.cpu.percentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Card */}
        <Card className="relative overflow-hidden border-purple-400/30 bg-black/95 shadow-2xl shadow-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
          <CardContent className="pt-6 pb-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center ring-2 ring-purple-400/50 shadow-xl shadow-purple-500/50 backdrop-blur-sm">
                  <HardDrive className="h-7 w-7 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Storage</p>
                  <p className="text-2xl font-extrabold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                    {resourceStats.disk.used} MB
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold text-white drop-shadow-[0_0_12px_rgba(168,85,247,1)]">
                  {Math.round(resourceStats.disk.percentage)}%
                </p>
                <p className="text-xs text-white/60 font-semibold">
                  / {resourceStats.disk.total} MB
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 rounded-full overflow-hidden bg-black/60 border border-purple-500/30 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 shadow-[0_0_20px_rgba(168,85,247,0.8)] transition-all duration-500"
                  style={{ width: `${resourceStats.disk.percentage}%` }}
                />
              </div>
              <div className="h-1 rounded-full overflow-hidden bg-black/40">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 shadow-[0_0_15px_rgba(168,85,247,1)] transition-all duration-500 animate-pulse"
                  style={{ width: `${resourceStats.disk.percentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Console Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <CardTitle>Server Console</CardTitle>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Badge variant="outline">{logs.length} logs</Badge>
              {errors.length > 0 && (
                <Badge variant="destructive" className="cursor-pointer" onClick={() => setShowErrors(!showErrors)}>
                  {errors.length} errors
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => sendPowerAction('start')} disabled={serverState === 'running'}>
                <Play className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendPowerAction('restart')}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendPowerAction('stop')} disabled={serverState === 'offline'}>
                <Square className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendPowerAction('kill')}>
                <Power className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {maxAttemptsReached && (
            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Console Connection Failed
                  </p>
                  <Button size="sm" onClick={manualReconnect} variant="outline">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Retry Connection
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Fixed Height Console */}
          <div className="relative">
            <div className="bg-black/95 rounded-lg p-4 h-[500px] overflow-y-auto text-sm shadow-inner" style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace" }}>
              {logs.length === 0 ? (
                <div className="text-gray-500 space-y-3">
                  <p>📡 {isConnected ? 'Connected. Waiting for console output...' : 'Connecting to console...'}</p>
                  {isConnected && (
                    <>
                      <p className="text-xs text-gray-600">
                        💡 Logs will appear here as the server generates output.
                      </p>
                      <p className="text-xs text-gray-600">
                        ✨ Logs persist between sessions!
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {logs.map((log, i) => {
                    const segments = parseAnsiLine(log)
                    const defaultColor = detectLogLevel(log)
                    
                    return (
                      <div key={i} className="whitespace-pre-wrap break-words hover:bg-white/5 py-0.5 px-1 -mx-1 transition-colors">
                        {segments.map((segment, j) => (
                          <span
                            key={j}
                            style={{
                              color: segment.color || defaultColor,
                              fontWeight: segment.bold ? 'bold' : 'normal',
                              fontStyle: segment.italic ? 'italic' : 'normal',
                              textDecoration: segment.underline ? 'underline' : 'none',
                            }}
                          >
                            {segment.text}
                          </span>
                        ))}
                      </div>
                    )
                  })}
                </>
              )}
              <div ref={logsEndRef} />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
              onClick={() => {
                setLogs([])
                localStorage.removeItem(`console-logs-${serverId}`)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Command Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter command..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  sendCommand(command)
                }
              }}
              style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace" }}
            />
            <Button onClick={() => sendCommand(command)}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Error Panel */}
      {errors.length > 0 && (
        <Collapsible open={showErrors} onOpenChange={setShowErrors}>
          <Card className="border-red-500/20 bg-red-500/5">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-red-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                    <CardTitle className="text-red-500">Console Errors</CardTitle>
                    <Badge variant="destructive">{errors.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {showErrors ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Button size="sm" variant="outline" onClick={() => setShowAI(!showAI)}>
                    <Bot className="h-4 w-4 mr-2" />
                    Ask AI for Help
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setErrors([])}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2 pr-4">
                    {errors.slice(-10).reverse().map((error, idx) => (
                      <Collapsible key={idx}>
                        <div className="border border-red-500/20 rounded-lg overflow-hidden">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 hover:bg-red-500/10 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge variant="destructive" className="text-xs flex-shrink-0">{error.type}</Badge>
                                <span className="text-sm text-left truncate flex-1">{error.message}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">{error.timestamp}</span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 bg-black/50 border-t border-red-500/20 max-h-[200px] overflow-y-auto">
                              <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap break-words">
                                {error.fullLog}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* AI Assistant */}
      {showAI && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>AI Assistant</CardTitle>
                {aiMessages.length > 0 && (
                  <Badge variant="outline">{aiMessages.length} messages</Badge>
                )}
                <Badge variant={aiLimit.canRequest ? "default" : "destructive"} className="text-xs">
                  {aiLimit.remaining}/{aiLimit.total} requests
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={clearAIChat}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAI(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {aiLimit.remaining < 10 && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ You have {aiLimit.remaining} AI requests remaining today.
                  {aiLimit.remaining === 0 && ' Purchase additional credits to continue.'}
                </p>
                {aiLimit.remaining === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💳 1000 requests for ₹100
                  </p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ScrollArea className="h-[300px] border rounded-lg p-4 bg-muted/20">
                {aiMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Ask me about errors, server issues, or console logs!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask about errors, performance, or get help debugging..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      askAI()
                    }
                  }}
                  disabled={aiLoading}
                  className="min-h-[60px] resize-none"
                />
                <Button onClick={askAI} disabled={aiLoading} className="self-end">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
