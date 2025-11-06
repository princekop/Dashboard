"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal, Send, Trash2, Play, Square, RotateCw, Power, AlertTriangle, ChevronDown, ChevronUp, Bot, X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { parseAnsiLine, detectLogLevel } from '@/lib/ansi-parser'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

interface ConsoleTabProps {
  serverId: string
  serverIdentifier: string
}

export function ConsoleTab({ serverId, serverIdentifier }: ConsoleTabProps) {
  // Load logs from localStorage on mount
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
  const [showAI, setShowAI] = useState(false)
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'assistant', content: string}[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`console-ai-${serverId}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const maxReconnectAttempts = 5 // Reduced from 10 to fail faster

  // Save logs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && logs.length > 0) {
      // Keep only last 1000 logs to prevent storage overflow
      const logsToSave = logs.slice(-1000)
      localStorage.setItem(`console-logs-${serverId}`, JSON.stringify(logsToSave))
    }
  }, [logs, serverId])

  useEffect(() => {
    // Suppress ALL WebSocket errors globally for this component
    const originalError = console.error
    const originalWarn = console.warn
    
    const errorFilter = (...args: any[]) => {
      const msg = args[0]?.toString() || ''
      if (msg.includes('WebSocket connection') || msg.includes('wss://')) {
        return // Suppress WebSocket spam
      }
      originalError(...args)
    }
    
    const warnFilter = (...args: any[]) => {
      const msg = args[0]?.toString() || ''
      if (msg.includes('WebSocket connection') || msg.includes('wss://')) {
        return // Suppress WebSocket spam
      }
      originalWarn(...args)
    }
    
    console.error = errorFilter
    console.warn = warnFilter
    
    connectWebSocket()
    
    return () => {
      // Restore original console methods
      console.error = originalError
      console.warn = originalWarn
      
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [serverId])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const manualReconnect = () => {
    reconnectAttemptsRef.current = 0
    setMaxAttemptsReached(false)
    sessionStorage.removeItem(`ws-error-logged-${serverId}`)
    connectWebSocket()
  }

  const connectWebSocket = async () => {
    // Stop trying after max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn(`[Console] Unable to connect after ${maxReconnectAttempts} attempts. Wings service unavailable.`)
      setMaxAttemptsReached(true)
      return
    }
    
    try {
      const res = await fetch(`/api/servers/${serverId}/websocket`)
      
      if (!res.ok) {
        reconnectAttemptsRef.current++
        const delay = Math.min(5000 * reconnectAttemptsRef.current, 30000)
        setTimeout(connectWebSocket, delay)
        return
      }
      
      const data = await res.json()
      
      // Handle both direct data and nested data.data structure
      const wsData = data.data || data
      
      if (wsData && wsData.token && wsData.socket) {
        const { token, socket } = wsData
        
        // Only log on first attempt or every 3rd attempt
        if (reconnectAttemptsRef.current === 0 || reconnectAttemptsRef.current % 3 === 0) {
          console.log(`[Console] Attempting connection... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
        }
        
        const ws = new WebSocket(socket)
        
        ws.onopen = () => {
          console.log('[Console] ✓ Connected successfully')
          ws.send(JSON.stringify({ event: 'auth', args: [token] }))
          setIsConnected(true)
          reconnectAttemptsRef.current = 0 // Reset on successful connection
          
          // Request console logs after auth
          setTimeout(() => {
            ws.send(JSON.stringify({ event: 'send logs', args: [null] }))
          }, 500)
        }
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data)
          
          if (message.event === 'console output') {
            const logLine = message.args[0]
            setLogs(prev => {
              const newLogs = [...prev, logLine]
              // Keep only last 1000 logs in memory
              return newLogs.slice(-1000)
            })
            
            // Detect errors
            if (logLine.match(/ERROR|SEVERE|Exception|FATAL|\[E\]/i)) {
              const errorMatch = logLine.match(/\[(.+?)\]:\s*(.+)|ERROR:\s*(.+)|Exception:\s*(.+)/i)
              setErrors(prev => [
                ...prev,
                {
                  type: logLine.includes('Exception') ? 'Exception' : 'Error',
                  message: errorMatch ? (errorMatch[2] || errorMatch[3] || errorMatch[4]) : logLine.substring(0, 100),
                  timestamp: new Date().toLocaleTimeString(),
                  fullLog: logLine
                }
              ].slice(-50)) // Keep last 50 errors
            }
          } else if (message.event === 'daemon message' || message.event === 'console') {
            // Handle bulk logs (when history is sent)
            if (Array.isArray(message.args)) {
              setLogs(prev => {
                const newLogs = [...prev, ...message.args]
                return newLogs.slice(-1000)
              })
            }
          } else if (message.event === 'status') {
            setServerState(message.args[0])
          } else if (message.event === 'token expiring' || message.event === 'token expired') {
            setTimeout(connectWebSocket, 1000)
          }
        }
        
        ws.onerror = () => {
          // Silently handle - user sees UI feedback
          setIsConnected(false)
        }
        
        ws.onclose = (event) => {
          setIsConnected(false)
          
          // Log on first attempt only
          if (reconnectAttemptsRef.current === 0 && event.code !== 1000) {
            console.warn(`[Console] Connection failed (Wings service unavailable)`)
          }
          
          // Don't spam reconnection attempts if the server is unreachable
          // Only retry if it was a clean disconnect or timeout
          if (event.code === 1000 || event.code === 1006) {
            reconnectAttemptsRef.current++
            const delay = Math.min(3000 * Math.pow(1.5, reconnectAttemptsRef.current), 30000)
            
            // Only log reconnection attempts if they're not maxed out
            if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
              setTimeout(connectWebSocket, delay)
            }
          } else {
            // Don't reconnect for other error codes
            setMaxAttemptsReached(true)
          }
        }
        
        wsRef.current = ws
      } else {
        // Invalid credentials - don't spam, just retry
        reconnectAttemptsRef.current++
        setTimeout(connectWebSocket, 5000)
      }
    } catch (error: any) {
      // Error getting credentials - just retry
      reconnectAttemptsRef.current++
      setTimeout(connectWebSocket, 5000)
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

    const userMessage = aiInput
    setAiMessages(prev => {
      const updated = [...prev, { role: 'user' as const, content: userMessage }]
      sessionStorage.setItem(`console-ai-${serverId}`, JSON.stringify(updated))
      return updated
    })
    setAiInput('')
    setAiLoading(true)

    try {
      const context = `Recent console logs:\n${logs.slice(-20).join('\n')}\n\nRecent errors:\n${errors.map(e => `${e.timestamp} - ${e.type}: ${e.message}`).join('\n')}`
      
      const res = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
          fileContent: null,
          fileName: null
        })
      })

      const data = await res.json()
      
      if (data.response) {
        setAiMessages(prev => {
          const updated = [...prev, { role: 'assistant' as const, content: data.response }]
          sessionStorage.setItem(`console-ai-${serverId}`, JSON.stringify(updated))
          return updated
        })
      }
    } catch (error) {
      console.error('AI request failed:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const clearAIChat = () => {
    setAiMessages([])
    sessionStorage.removeItem(`console-ai-${serverId}`)
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Terminal className="h-5 w-5 text-primary" />
              <CardTitle>Server Console</CardTitle>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              {logs.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {logs.length} logs
                </Badge>
              )}
              {!isConnected && (
                <a
                  href={`https://pro.darkbyte.in/server/${serverIdentifier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline ml-2"
                >
                  Open in Pterodactyl Panel →
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => sendPowerAction('start')}>
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendPowerAction('restart')}>
                <RotateCw className="h-4 w-4 mr-1" />
                Restart
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendPowerAction('stop')}>
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
              <Button size="sm" variant="destructive" onClick={() => sendPowerAction('kill')}>
                <Power className="h-4 w-4 mr-1" />
                Kill
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected && logs.length === 0 && !maxAttemptsReached && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Connecting to console...
                </p>
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                If connection fails, you can still use all other features or access the console directly through the Pterodactyl panel.
              </p>
            </div>
          )}
          {!isConnected && logs.length > 0 && !maxAttemptsReached && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Console disconnected. Attempting to reconnect...
                <span className="text-xs">(Power controls still work)</span>
              </p>
            </div>
          )}
          {maxAttemptsReached && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Console Connection Failed
                  </p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-3">
                    Unable to connect to Pterodactyl Wings WebSocket service after {maxReconnectAttempts} attempts.
                  </p>
                  <div className="text-xs space-y-1 text-red-600/70 dark:text-red-400/70">
                    <p><strong>Possible causes:</strong></p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Wings daemon is not running on the server</li>
                      <li>WebSocket port (8080) is blocked by firewall</li>
                      <li>SSL certificate issue for WebSocket connections</li>
                      <li>Server is offline or unreachable</li>
                    </ul>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={manualReconnect} className="shrink-0">
                  <RotateCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
              <div className="pt-3 border-t border-red-500/20 space-y-2">
                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                  <strong>✓ Still Available:</strong> Power controls (Start/Stop/Restart), File Manager, and all other features work normally.
                </p>
                <a
                  href={`https://pro.darkbyte.in/server/${serverIdentifier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  <Terminal className="h-3 w-3" />
                  Open Console in Pterodactyl Panel →
                </a>
              </div>
            </div>
          )}
          <div className="relative h-[calc(100vh-400px)] min-h-[400px]">
            <div className="bg-black/95 rounded-lg p-4 h-full overflow-y-auto font-mono text-sm shadow-inner">
              {logs.length === 0 ? (
                <div className="text-gray-500 space-y-3">
                  <p>📡 {isConnected ? 'Connected. Waiting for new console output...' : 'Connecting to console...'}</p>
                  {isConnected && (
                    <>
                      <p className="text-xs text-gray-600">
                        💡 Logs will appear here as the server generates output. Start the server to see logs.
                      </p>
                      <p className="text-xs text-gray-600">
                        ✨ Logs persist between sessions - they&apos;ll be here when you return!
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
              className="absolute top-2 right-2"
              onClick={() => {
                setLogs([])
                localStorage.removeItem(`console-logs-${serverId}`)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
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
              className="font-mono"
            />
            <Button onClick={() => sendCommand(command)}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Panel */}
      {errors.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-500">Console Errors</CardTitle>
                <Badge variant="destructive">{errors.length}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAI(!showAI)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Ask AI
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setErrors([])}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
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
        </Card>
      )}

      {/* AI Assistant Panel */}
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
