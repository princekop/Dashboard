"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Download, Loader2, CheckCircle, AlertCircle, Server, Package, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AISetupAssistantProps {
  serverId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISetupAssistant({ serverId, open, onOpenChange }: AISetupAssistantProps) {
  const [request, setRequest] = useState('')
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [installProgress, setInstallProgress] = useState<{current: number, total: number, plugin: string} | null>(null)
  const [installed, setInstalled] = useState<string[]>([])

  const handleSearch = async () => {
    if (!request.trim()) return

    setLoading(true)
    setError('')
    setResults(null)
    setSuccess('')

    try {
      const res = await fetch(`/api/servers/${serverId}/ai-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: request.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to search'
        setError(errorMsg)
        return
      }

      setResults(data)
      
      console.log('AI Setup Results:', {
        isFullSetup: data.isFullSetup,
        autoInstall: data.autoInstall,
        pluginCount: data.results?.length,
        setupType: data.setupType
      })
      
      // Auto-install if requested
      if (data.autoInstall && data.results && data.results.length > 0) {
        console.log(`🚀 Starting auto-installation of ${data.results.length} plugins...`)
        // Small delay to show the UI first
        setTimeout(() => {
          handleBulkInstall(data.results)
        }, 500)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkInstall = async (plugins: any[]) => {
    setInstalling(true)
    setError('')
    setSuccess('')
    setInstalled([])
    
    const installedList: string[] = []
    const failedList: string[] = []

    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i]
      setInstallProgress({ current: i + 1, total: plugins.length, plugin: plugin.title })

      try {
        // Get download URL
        const downloadRes = await fetch(`https://api.modrinth.com/v2/project/${plugin.project_id}/version`)
        const versions = await downloadRes.json()

        if (!versions || versions.length === 0) {
          failedList.push(plugin.title)
          continue
        }

        const latestVersion = versions[0]
        const primaryFile = latestVersion.files.find((f: any) => f.primary) || latestVersion.files[0]

        // Install
        const installRes = await fetch(`/api/servers/${serverId}/ai-install`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: plugin.project_id,
            downloadUrl: primaryFile.url,
            filename: primaryFile.filename,
            serverType: results.serverInfo.type,
            needsRestart: i === plugins.length - 1 // Only restart after last plugin
          })
        })

        if (installRes.ok) {
          installedList.push(plugin.title)
          setInstalled([...installedList]) // Update state to show checkmark
        } else {
          failedList.push(plugin.title)
        }

        // Small delay between installations
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (err) {
        failedList.push(plugin.title)
      }
    }

    setInstallProgress(null)
    setInstalling(false)

    if (failedList.length === 0) {
      setSuccess(`✅ Successfully installed all ${installedList.length} plugins! Server is restarting...`)
    } else {
      setSuccess(`Installed ${installedList.length} plugins. ${failedList.length} failed: ${failedList.join(', ')}`)
    }

    // Close dialog after success
    setTimeout(() => {
      onOpenChange(false)
      setRequest('')
      setResults(null)
      setSuccess('')
    }, 4000)
  }

  const handleInstall = async (result: any) => {
    setInstalling(true)
    setError('')
    setSuccess('')

    try {
      // Get download URL first
      const downloadRes = await fetch(`https://api.modrinth.com/v2/project/${result.project_id}/version`)
      const versions = await downloadRes.json()

      if (!versions || versions.length === 0) {
        setError('No versions available for this plugin/mod')
        return
      }

      const latestVersion = versions[0]
      const primaryFile = latestVersion.files.find((f: any) => f.primary) || latestVersion.files[0]

      // Install
      const installRes = await fetch(`/api/servers/${serverId}/ai-install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: result.project_id,
          downloadUrl: primaryFile.url,
          filename: primaryFile.filename,
          serverType: results.serverInfo.type,
          needsRestart: results.needsRestart
        })
      })

      const installData = await installRes.json()

      if (!installRes.ok) {
        setError(installData.error || 'Installation failed')
        return
      }

      setSuccess(installData.message)
      
      // Close dialog after 3 seconds
      setTimeout(() => {
        onOpenChange(false)
        setRequest('')
        setResults(null)
        setSuccess('')
      }, 3000)

    } catch (err: any) {
      setError(err.message || 'Installation failed')
    } finally {
      setInstalling(false)
    }
  }

  const containerElement = typeof document !== 'undefined' ? document.getElementById('server-panel-container') : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" container={containerElement}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Setup Assistant
          </DialogTitle>
          <DialogDescription>
            Tell me what you want to install and I&apos;ll find and set it up for you automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Server Info */}
          {results?.serverInfo && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Server className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Server Type:</span>
                  <Badge variant="default">{results.serverInfo.type}</Badge>
                  {results.serverInfo.version && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>Version: {results.serverInfo.version}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium">What would you like to install?</label>
            <Textarea
              placeholder="Examples:&#10;• Install EssentialsX plugin&#10;• I want WorldEdit for my server&#10;• Add a shop plugin&#10;• Install JEI mod for 1.20.1"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={4}
              disabled={loading || installing}
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !request.trim() || installing}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Search & Analyze
                </>
              )}
            </Button>
          </div>

          {/* Installation Progress */}
          {installProgress && (
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        Installing {installProgress.current} of {installProgress.total}
                      </p>
                      <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                        Current: {installProgress.plugin}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-blue-500/20 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${(installProgress.current / installProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {success && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">Success!</p>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">{success}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">Error</p>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results?.results && results.results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">
                    {results.isFullSetup 
                      ? `${results.setupType || 'Server'} Setup - ${results.results.length} Plugins` 
                      : `Found ${results.results.length} matches`}
                  </h3>
                  {results.message && (
                    <p className="text-sm text-muted-foreground mt-1">{results.message}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {results.isFullSetup && (
                    <Badge variant="default" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Full Setup
                    </Badge>
                  )}
                  {results.needsRestart && (
                    <Badge variant="secondary" className="gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Restart Required
                    </Badge>
                  )}
                </div>
              </div>

              {results.isFullSetup && results.autoInstall && !installing && !installProgress && (
                <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30 shadow-lg">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-base font-bold text-green-600 dark:text-green-400 mb-1">
                          🚀 Auto-Installation Starting!
                        </p>
                        <p className="text-sm text-green-600/90 dark:text-green-400/90">
                          All {results.results.length} plugins will be installed automatically. No manual action needed!
                        </p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-2">
                          ⏳ This will take approximately {Math.ceil(results.results.length * 1.5)} seconds...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {results.results.map((result: any, index: number) => (
                <Card key={result.project_id} className="border-primary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base">{result.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                      {index === 0 && (
                        <Badge variant="default">Best Match</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {result.project_type}
                      </Badge>
                      <Badge variant="outline">
                        {result.downloads.toLocaleString()} downloads
                      </Badge>
                      {result.categories.slice(0, 3).map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                    {!results.autoInstall && (
                      <Button
                        onClick={() => handleInstall(result)}
                        disabled={installing}
                        className="w-full"
                        variant={index === 0 ? "default" : "outline"}
                      >
                        {installing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Installing...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Install {result.title}
                          </>
                        )}
                      </Button>
                    )}
                    {results.autoInstall && (
                      <div className="w-full px-3 py-2 text-center text-sm text-muted-foreground bg-muted/50 rounded-md">
                        {installProgress && installProgress.plugin === result.title ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Installing now...
                          </span>
                        ) : installed.includes(result.title) ? (
                          <span className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Installed
                          </span>
                        ) : (
                          <span>Queued for installation</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {results && results.results?.length === 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="pt-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No plugins/mods found matching &quot;{results.searchQuery}&quot;. Try different keywords or check the spelling.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
