"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Save, RotateCcw } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface StartupVariable {
  name: string
  description: string
  env_variable: string
  default_value: string
  server_value: string
  is_editable: boolean
  rules: string
}

interface StartupTabProps {
  serverId: string
}

export function StartupTab({ serverId }: StartupTabProps) {
  const [variables, setVariables] = useState<StartupVariable[]>([])
  const [startupCommand, setStartupCommand] = useState('')
  const [loading, setLoading] = useState(false)
  const [changes, setChanges] = useState<Record<string, string>>({})

  useEffect(() => {
    loadStartupSettings()
  }, [serverId])

  const loadStartupSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/startup`)
      const data = await res.json()
      setVariables(data.data || [])
      setStartupCommand(data.meta?.startup_command || '')
    } catch (error) {
      console.error('Failed to load startup settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateVariable = async (envVar: string, value: string) => {
    try {
      await fetch(`/api/servers/${serverId}/startup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: envVar, value })
      })
      loadStartupSettings()
      const newChanges = { ...changes }
      delete newChanges[envVar]
      setChanges(newChanges)
    } catch (error) {
      console.error('Failed to update variable:', error)
    }
  }

  const handleChange = (envVar: string, value: string) => {
    setChanges({ ...changes, [envVar]: value })
  }

  const saveAllChanges = async () => {
    for (const [envVar, value] of Object.entries(changes)) {
      await updateVariable(envVar, value)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Startup Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Startup Command</Label>
            <Textarea
              value={startupCommand}
              readOnly
              className="font-mono text-sm bg-muted"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This is the command used to start your server
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Environment Variables</h3>
                {Object.keys(changes).length > 0 && (
                  <Button size="sm" onClick={saveAllChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes ({Object.keys(changes).length})
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {variables.map((variable, index) => (
                  <Card key={`${variable.env_variable}-${index}`} className="border-primary/10">
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <Label className="text-base">{variable.name}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {variable.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={changes[variable.env_variable] ?? variable.server_value}
                            onChange={(e) => handleChange(variable.env_variable, e.target.value)}
                            disabled={!variable.is_editable}
                            className="font-mono"
                          />
                          {variable.is_editable && changes[variable.env_variable] !== undefined && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateVariable(variable.env_variable, changes[variable.env_variable])}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newChanges = { ...changes }
                                  delete newChanges[variable.env_variable]
                                  setChanges(newChanges)
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Variable: {variable.env_variable}</span>
                          {variable.default_value && (
                            <span>Default: {variable.default_value}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
