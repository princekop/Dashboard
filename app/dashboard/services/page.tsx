"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Server, Key, ExternalLink, Clock, Cpu, HardDrive, Activity, Zap, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ServiceServer {
  id: string
  name: string
  status: string
  expiresAt: string
  product: {
    name: string
    ram: number
    cpu: number
    storage: number
  }
  pterodactylId: number | null
  pterodactylIdentifier: string | null
}

export default function ServicesPage() {
  const [servers, setServers] = useState<ServiceServer[]>([])
  const [selectedServer, setSelectedServer] = useState<ServiceServer | null>(null)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pteroAccount, setPteroAccount] = useState<any>(null)

  useEffect(() => {
    fetchServers()
    fetchPteroAccount()
  }, [])

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/services/my-servers')
      const data = await res.json()
      setServers(data.servers || [])
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPteroAccount = async () => {
    try {
      const res = await fetch('/api/services/pterodactyl-account')
      const data = await res.json()
      setPteroAccount(data.account)
    } catch (error) {
      console.error('Failed to fetch account:', error)
    }
  }

  const handleResetPassword = async () => {
    try {
      const res = await fetch('/api/services/reset-password', {
        method: 'POST'
      })
      
      const data = await res.json()
      if (res.ok) {
        alert(`Password reset! New password: ${data.password}\nPlease save this password securely.`)
        setShowResetPassword(false)
      }
    } catch (error) {
      console.error('Failed to reset password:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'suspended': return 'bg-yellow-500'
      case 'terminated': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Enhanced Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-7 w-7 text-primary animate-pulse" />
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    My Services
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Manage and monitor your hosting servers
                </p>
              </div>
            </div>

            {pteroAccount && (
              <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">Panel Access</CardTitle>
                        <CardDescription>Server management dashboard</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => setShowResetPassword(true)} className="shadow-md hover:shadow-lg transition-shadow">
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-background/50 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Panel URL</p>
                      <a href={pteroAccount.panelUrl} target="_blank" rel="noopener" className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 group">
                        <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        {pteroAccount.panelUrl}
                      </a>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Account Email</p>
                      <p className="text-sm font-medium">{pteroAccount.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : servers.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Server className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-xl font-semibold mb-2">No services yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Purchase a hosting plan to get started</p>
                  <Button onClick={() => window.location.href = '/dashboard/products'}>
                    <Zap className="h-4 w-4 mr-2" />
                    Browse Plans
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {servers.map((server) => (
                  <Card 
                    key={server.id}
                    className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      server.status === 'suspended' ? 'opacity-60' : 'border-primary/20'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {server.status === 'active' && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                        <Activity className="h-3 w-3 text-green-600 animate-pulse" />
                        <span className="text-xs font-medium text-green-600">Online</span>
                      </div>
                    )}
                    <CardHeader className="relative z-10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors mb-1">
                            {server.name}
                          </CardTitle>
                          <CardDescription className="text-sm">{server.product.name}</CardDescription>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(server.status)} w-fit`}>
                        {server.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Server className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-lg font-bold">{server.product.ram}</p>
                          <p className="text-xs text-muted-foreground">GB RAM</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Cpu className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-lg font-bold">{server.product.cpu}</p>
                          <p className="text-xs text-muted-foreground">Cores</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-center">
                          <div className="flex items-center justify-center mb-1">
                            <HardDrive className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-lg font-bold">{server.product.storage}</p>
                          <p className="text-xs text-muted-foreground">GB SSD</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                        <Clock className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Expires</p>
                          <p className="text-sm font-semibold">
                            {server.status === 'active' 
                              ? `${getDaysRemaining(server.expiresAt)} days remaining`
                              : 'Service suspended'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="relative z-10 border-t border-primary/10">
                      {server.pterodactylIdentifier && (
                        <Button variant="outline" className="w-full hover:bg-primary/10 hover:border-primary/50 transition-all shadow-sm" asChild>
                          <a href={`${pteroAccount?.panelUrl}/server/${server.pterodactylIdentifier}`} target="_blank" rel="noopener">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Manage Server
                          </a>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Pterodactyl Password</DialogTitle>
            <DialogDescription>
              This will generate a new password for your panel access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reset your Pterodactyl panel password? 
              Your current password will no longer work.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleResetPassword}>
                Reset Password
              </Button>
              <Button variant="outline" onClick={() => setShowResetPassword(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
