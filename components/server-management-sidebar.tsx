"use client"

import * as React from "react"
import {
  Terminal,
  Folder,
  Database,
  Network,
  Settings,
  Puzzle,
  Package,
  Gamepad2,
  Trash2,
  Wrench,
  Archive,
  Bot,
  ArrowLeft,
  Server as ServerIcon,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface ServerManagementSidebarProps extends React.ComponentProps<typeof Sidebar> {
  serverId: string
  serverName: string
  serverStatus?: string
  serverIp?: string
  serverPort?: string
}

export function ServerManagementSidebar({ 
  serverId, 
  serverName, 
  serverStatus,
  serverIp,
  serverPort,
  ...props 
}: ServerManagementSidebarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Extract current tab from URL
  const getCurrentTab = () => {
    const match = pathname.match(/\/dashboard\/servers\/[^/]+\/([^/]+)/)
    return match ? match[1] : 'console'
  }

  const currentTab = getCurrentTab()

  const navItems = [
    {
      title: "Console",
      url: `/dashboard/servers/${serverId}/console`,
      icon: Terminal,
      value: "console"
    },
    {
      title: "File Manager",
      url: `/dashboard/servers/${serverId}/files`,
      icon: Folder,
      value: "files"
    },
    {
      title: "Databases",
      url: `/dashboard/servers/${serverId}/databases`,
      icon: Database,
      value: "databases"
    },
    {
      title: "Backups",
      url: `/dashboard/servers/${serverId}/backups`,
      icon: Archive,
      value: "backups"
    },
    {
      title: "Network",
      url: `/dashboard/servers/${serverId}/ports`,
      icon: Network,
      value: "ports"
    },
    {
      title: "Startup",
      url: `/dashboard/servers/${serverId}/startup`,
      icon: Wrench,
      value: "startup"
    },
  ]

  const advancedItems = [
    {
      title: "Plugins",
      url: `/dashboard/servers/${serverId}/plugins`,
      icon: Puzzle,
      value: "plugins"
    },
    {
      title: "Mods",
      url: `/dashboard/servers/${serverId}/mods`,
      icon: Package,
      value: "mods"
    },
    {
      title: "Version Manager",
      url: `/dashboard/servers/${serverId}/version`,
      icon: Gamepad2,
      value: "version"
    },
    {
      title: "Settings",
      url: `/dashboard/servers/${serverId}/settings`,
      icon: Settings,
      value: "settings"
    },
    {
      title: "Trash",
      url: `/dashboard/servers/${serverId}/trash`,
      icon: Trash2,
      value: "trash"
    },
  ]

  const devItems = user?.devMode ? [
    {
      title: "Bot Controller",
      url: `/dashboard/servers/${serverId}/bots`,
      icon: Bot,
      value: "bots"
    },
  ] : []

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-3"
            >
              <Link href="/dashboard/services" className="flex items-center gap-3">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Services</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <div className="px-3 py-3 border rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <ServerIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm truncate">{serverName}</h2>
                  {serverStatus && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        serverStatus === 'running' ? 'bg-green-500 animate-pulse' :
                        serverStatus === 'starting' ? 'bg-yellow-500 animate-pulse' :
                        'bg-red-500'
                      )} />
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {serverStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {serverIp && serverPort && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-background/50 rounded text-[10px] font-mono">
                  <Terminal className="h-3 w-3 text-primary" />
                  <span className="font-bold truncate">{serverIp}:{serverPort}</span>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Server Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentTab === item.value}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Advanced Options */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Advanced
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentTab === item.value}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Dev Mode Items */}
        {user?.devMode && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Developer Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {devItems.map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentTab === item.value}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
          Server ID: {serverId.slice(0, 8)}...
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
