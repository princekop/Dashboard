"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AdminCheck } from "@/lib/admin-check"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Server, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AdminPterodactylPage() {
  return (
    <AdminCheck>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-6 p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Pterodactyl Integration</h1>
                    <Badge variant="outline" className="gap-1">
                      <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                      Not Connected
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
                      />
                      <p className="text-xs text-muted-foreground">
                        Generate an Application API Key from your Pterodactyl admin panel
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                      <Button variant="outline">
                        Test Connection
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
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminCheck>
  )
}
