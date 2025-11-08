"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Gamepad2, Download, Loader2 } from 'lucide-react'
import { 
  SERVER_TYPES, 
  VersionFetcher, 
  ServerAPI 
} from '@/lib/server-management'
import { ServerTypeSelector } from './version-tab-components/ServerTypeSelector'
import { VersionSelector } from './version-tab-components/VersionSelector'
import { BuildSelector } from './version-tab-components/BuildSelector'
import { WarningAlert, ErrorAlert, BedrockNote } from './version-tab-components/AlertMessages'
import { InstallProgress } from './version-tab-components/InstallProgress'

interface VersionTabProps {
  serverId: string
}

export function VersionTabRefactored({ serverId }: VersionTabProps) {
  const [serverType, setServerType] = useState('paper')
  const [versions, setVersions] = useState<string[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [selectedBuild, setSelectedBuild] = useState('')
  const [builds, setBuilds] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [loadingBuilds, setLoadingBuilds] = useState(false)
  const [installProgress, setInstallProgress] = useState(0)
  const [error, setError] = useState('')

  const api = new ServerAPI(serverId)
  const currentServerType = SERVER_TYPES.find(t => t.id === serverType)
  const Icon = currentServerType?.icon || Gamepad2

  useEffect(() => {
    loadVersions()
  }, [serverType])

  useEffect(() => {
    if (selectedVersion && ['paper', 'purpur', 'fabric'].includes(serverType)) {
      loadBuilds()
    }
  }, [selectedVersion, serverType])

  const loadVersions = async () => {
    setLoading(true)
    setError('')
    setVersions([])
    setBuilds([])
    setSelectedVersion('')
    setSelectedBuild('')

    try {
      const fetchedVersions = await VersionFetcher.fetchVersions(serverType)
      setVersions(fetchedVersions)
      if (fetchedVersions.length > 0) {
        setSelectedVersion(fetchedVersions[0])
      }
    } catch (error: any) {
      console.error('Failed to load versions:', error)
      setError(`Failed to load versions: ${error.message}. Check your internet connection.`)
    } finally {
      setLoading(false)
    }
  }

  const loadBuilds = async () => {
    setLoadingBuilds(true)
    setError('')

    try {
      const fetchedBuilds = await VersionFetcher.fetchBuilds(serverType, selectedVersion)
      setBuilds(fetchedBuilds)
      
      if (fetchedBuilds.length > 0) {
        const buildValue = typeof fetchedBuilds[0] === 'object' 
          ? fetchedBuilds[0].version 
          : fetchedBuilds[0].toString()
        setSelectedBuild(buildValue)
      }
    } catch (error: any) {
      console.error('Failed to load builds:', error)
      setError(`Failed to load builds: ${error.message}`)
    } finally {
      setLoadingBuilds(false)
    }
  }

  const installVersion = async () => {
    if (!selectedVersion) {
      alert('Please select a version')
      return
    }

    if (!['vanilla', 'bedrock', 'spigot'].includes(serverType) && !selectedBuild) {
      alert('Please select a build')
      return
    }

    const confirmMsg = serverType === 'bedrock' 
      ? `Install ${serverType.toUpperCase()} ${selectedVersion}? This will replace your server and requires Bedrock-specific configuration.`
      : `Install ${serverType.toUpperCase()} ${selectedVersion}${selectedBuild ? ` build #${selectedBuild}` : ''}? This will replace server.jar and restart the server.`

    if (!confirm(confirmMsg)) {
      return
    }

    setInstalling(true)
    setInstallProgress(0)
    setError('')

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      await api.installVersion({
        serverType,
        version: selectedVersion,
        build: selectedBuild || 'latest'
      })

      clearInterval(progressInterval)
      setInstallProgress(100)

      alert('Version installed successfully! Server will restart.')
    } catch (error: any) {
      console.error('Failed to install version:', error)
      setError(error.message || 'Failed to install version')
      alert(error.message || 'Failed to install version')
    } finally {
      setInstalling(false)
      setTimeout(() => setInstallProgress(0), 2000)
    }
  }

  const needsBuilds = ['paper', 'purpur', 'fabric'].includes(serverType)

  return (
    <div className="space-y-4 p-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Version Manager
          </CardTitle>
          <CardDescription>
            Download and install different server software versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <WarningAlert />
          <ErrorAlert error={error} />

          <ServerTypeSelector 
            selectedType={serverType} 
            onSelect={setServerType} 
          />

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 pb-2 border-b">
              <Icon className={`h-5 w-5 ${currentServerType?.color}`} />
              <h3 className="font-semibold">
                Install {currentServerType?.name}
              </h3>
            </div>

            <VersionSelector
              versions={versions}
              selectedVersion={selectedVersion}
              onSelect={setSelectedVersion}
              loading={loading}
              serverType={serverType}
            />

            {needsBuilds && (
              <BuildSelector
                builds={builds}
                selectedBuild={selectedBuild}
                onSelect={setSelectedBuild}
                loading={loadingBuilds}
                serverType={serverType}
                disabled={!selectedVersion}
              />
            )}

            {installing && <InstallProgress progress={installProgress} />}

            <Button 
              className="w-full" 
              onClick={installVersion}
              disabled={installing || loading || !selectedVersion || (needsBuilds && !selectedBuild)}
              size="lg"
            >
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Installing {installProgress}%...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install {currentServerType?.name} {selectedVersion}
                  {selectedBuild && ` #${selectedBuild}`}
                </>
              )}
            </Button>
          </div>

          {serverType === 'bedrock' && (
            <div className="pt-4 border-t">
              <BedrockNote />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
