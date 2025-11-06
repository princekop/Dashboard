"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, CheckCircle } from "lucide-react"

export default function SetupPterodactylPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/user/setup-pterodactyl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      })

      const data = await res.json()
      
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/services')
        }, 2000)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to setup:', error)
      alert('Failed to configure Pterodactyl API key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Setup Pterodactyl API Key</CardTitle>
                  <CardDescription>Configure your client API key</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
                  <p className="text-muted-foreground">Redirecting to services...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Pterodactyl Client API Key</Label>
                    <Input
                      id="apiKey"
                      type="text"
                      placeholder="ptlc_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your Pterodactyl client API key (starts with ptlc_)
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-semibold">Quick Setup:</p>
                    <p className="text-muted-foreground">
                      Use this key for testing:
                    </p>
                    <code className="block bg-background p-2 rounded border text-xs break-all">
                      ptlc_uUfdZpYOvZ1ZNnHxrrNNC7v6I5pLRzWQ5M4yBXYYPnv
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setApiKey('ptlc_uUfdZpYOvZ1ZNnHxrrNNC7v6I5pLRzWQ5M4yBXYYPnv')}
                    >
                      Use This Key
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Configuring...' : 'Configure API Key'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
