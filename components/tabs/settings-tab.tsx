"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Save, Server } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SettingsTabProps {
  serverId: string
}

export function SettingsTab({ serverId }: SettingsTabProps) {
  const [serverName, setServerName] = useState('')
  const [dockerImage, setDockerImage] = useState('ghcr.io/pterodactyl/yolks:java_21')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [serverId])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/settings`)
      const data = await res.json()
      if (data.name) setServerName(data.name)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateServerName = async () => {
    try {
      await fetch(`/api/servers/${serverId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: serverName })
      })
      alert('Server name updated successfully')
    } catch (error) {
      console.error('Failed to update server name:', error)
    }
  }

  const updateDockerImage = async () => {
    try {
      await fetch(`/api/servers/${serverId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docker_image: dockerImage })
      })
      alert('Docker image updated successfully')
    } catch (error) {
      console.error('Failed to update docker image:', error)
    }
  }

  const dockerImages = [
    { value: 'ghcr.io/pterodactyl/yolks:java_21', label: 'Java 21' },
    { value: 'ghcr.io/pterodactyl/yolks:java_17', label: 'Java 17' },
    { value: 'ghcr.io/pterodactyl/yolks:java_16', label: 'Java 16' },
    { value: 'ghcr.io/pterodactyl/yolks:java_11', label: 'Java 11' },
    { value: 'ghcr.io/pterodactyl/yolks:java_8', label: 'Java 8' }
  ]

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Server Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
          ) : (
            <>
              <div className="space-y-3">
                <Label>Server Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder="My Minecraft Server"
                  />
                  <Button onClick={updateServerName}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The display name for your server
                </p>
              </div>

              <div className="space-y-3">
                <Label>Docker Image</Label>
                <Select value={dockerImage} onValueChange={setDockerImage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dockerImages.map(img => (
                      <SelectItem key={img.value} value={img.value}>
                        {img.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={updateDockerImage} variant="outline" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Update Docker Image
                </Button>
                <p className="text-xs text-muted-foreground">
                  The Java version for your server
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Server Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Server ID</p>
                    <p className="font-mono">{serverId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p>Active</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
