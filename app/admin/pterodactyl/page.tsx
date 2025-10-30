"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Server, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

export default function AdminPterodactylPage() {
  const [settings, setSettings] = useState({
    panelUrl: '',
    apiKey: ''
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/pterodactyl/settings')
      const data = await res.json()
      if (data.settings) {
        setSettings({
          panelUrl: data.settings.panelUrl || '',
          apiKey: data.settings.apiKey || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pterodactyl/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/pterodactyl/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await res.json()
      setTestResult({
        success: res.ok,
        message: data.message || (res.ok ? 'Connection successful!' : 'Connection failed')
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Pterodactyl Integration</h1>
            <Badge variant="outline" className="gap-1">
              <div className={`h-2 w-2 rounded-full ${settings.panelUrl && settings.apiKey ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              {settings.panelUrl && settings.apiKey ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Configure Pterodactyl panel integration for automated server provisioning.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Panel Configuration
            </CardTitle>
            <CardDescription>
              Connect your Pterodactyl panel to automate server creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="panelUrl">Panel URL</Label>
              <Input
                id="panelUrl"
                placeholder="https://panel.example.com"
                type="url"
                value={settings.panelUrl}
                onChange={(e) => setSettings({ ...settings, panelUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Pterodactyl panel URL (including https://)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">Application API Key</Label>
              <Input
                id="apiKey"
                placeholder="ptla_xxxxxxxxxxxxxxxxxxxx"
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Generate an Application API Key from your Pterodactyl admin panel
              </p>
            </div>

            {testResult && (
              <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <p className={`text-sm font-medium ${testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testing || !settings.panelUrl || !settings.apiKey}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Features</CardTitle>
            <CardDescription>
              What you can do with Pterodactyl integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Automatic Server Creation</p>
                <p className="text-sm text-muted-foreground">
                  Automatically provision servers when customers place orders
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Resource Allocation</p>
                <p className="text-sm text-muted-foreground">
                  Dynamically allocate RAM, CPU, and storage based on product plans
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">
                  Sync user accounts between Byte Pro and Pterodactyl
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Server Control</p>
                <p className="text-sm text-muted-foreground">
                  Allow users to manage their servers directly from the dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
