"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, MessageSquare } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

interface ChatMessage {
  id: string
  userId: string
  isAdmin: boolean
  message: string
  createdAt: string
}

interface ChatSession {
  orderId: string
  userName: string
  userEmail: string
  lastMessage: string
  unreadCount: number
}

export default function AdminChatsPage() {
  const searchParams = useSearchParams()
  const selectedOrderId = searchParams.get('orderId')
  
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeOrderId, setActiveOrderId] = useState<string | null>(selectedOrderId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (activeOrderId) {
      fetchMessages(activeOrderId)
      const interval = setInterval(() => fetchMessages(activeOrderId), 3000)
      return () => clearInterval(interval)
    }
  }, [activeOrderId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/chats/sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchMessages = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/chats/${orderId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeOrderId) return

    try {
      const res = await fetch('/api/admin/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrderId,
          message: newMessage,
          isAdmin: true
        })
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages(activeOrderId)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Customer Chats</h1>
        <p className="text-muted-foreground">
          Communicate with customers about their orders
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chat Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Chats</CardTitle>
            <CardDescription>Recent customer conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active chats</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.orderId}
                  onClick={() => setActiveOrderId(session.orderId)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    activeOrderId === session.orderId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{session.userName}</p>
                    {session.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {session.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-80 truncate">{session.lastMessage}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2">
          {activeOrderId ? (
            <>
              <CardHeader>
                <CardTitle className="text-base">Chat Messages</CardTitle>
                <CardDescription>Order #{activeOrderId.slice(0, 8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-md">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No messages yet
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.isAdmin
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-[500px]">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select a chat to start messaging</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
