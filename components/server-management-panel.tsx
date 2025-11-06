"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Terminal, Folder, Database, Network, Settings, Puzzle, Package, Gamepad2, Trash2, Wrench } from 'lucide-react'
import { ConsoleTab } from '@/components/tabs/console-tab'
import { FileManagerTab } from '@/components/tabs/file-manager-tab'
import { DatabaseTab } from '@/components/tabs/database-tab'
import { PortsTab } from '@/components/tabs/ports-tab'
import { StartupTab } from '@/components/tabs/startup-tab'
import { PluginsTab } from '@/components/tabs/plugins-tab'
import { ModsTab } from '@/components/tabs/mods-tab'
import { VersionTab } from '@/components/tabs/version-tab'
import { SettingsTab } from '@/components/tabs/settings-tab'
import { TrashTab } from '@/components/tabs/trash-tab'

interface ServerManagementPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverId: string
  serverName: string
  serverIdentifier: string
}

export function ServerManagementPanel({
  open,
  onOpenChange,
  serverId,
  serverName,
  serverIdentifier
}: ServerManagementPanelProps) {
  const [activeTab, setActiveTab] = useState('console')

  console.log('ServerManagementPanel rendered:', { open, serverId, serverName })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-background">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            {serverName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4 border-b overflow-x-auto">
              <TabsList className="inline-flex h-auto p-1 bg-muted/50">
                <TabsTrigger value="console" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  Console
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <Folder className="h-4 w-4" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="databases" className="gap-2">
                  <Database className="h-4 w-4" />
                  Databases
                </TabsTrigger>
                <TabsTrigger value="ports" className="gap-2">
                  <Network className="h-4 w-4" />
                  Ports
                </TabsTrigger>
                <TabsTrigger value="startup" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  Startup
                </TabsTrigger>
                <TabsTrigger value="plugins" className="gap-2">
                  <Puzzle className="h-4 w-4" />
                  Plugins
                </TabsTrigger>
                <TabsTrigger value="mods" className="gap-2">
                  <Package className="h-4 w-4" />
                  Mods
                </TabsTrigger>
                <TabsTrigger value="version" className="gap-2">
                  <Gamepad2 className="h-4 w-4" />
                  Version
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="trash" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Trash
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="console" className="mt-0">
                <ConsoleTab serverId={serverId} serverIdentifier={serverIdentifier} />
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <FileManagerTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="databases" className="mt-0">
                <DatabaseTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="ports" className="mt-0">
                <PortsTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="startup" className="mt-0">
                <StartupTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="plugins" className="mt-0">
                <PluginsTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="mods" className="mt-0">
                <ModsTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="version" className="mt-0">
                <VersionTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsTab serverId={serverId} />
              </TabsContent>

              <TabsContent value="trash" className="mt-0">
                <TrashTab serverId={serverId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
