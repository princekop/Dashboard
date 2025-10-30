"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AdminCheck } from "@/lib/admin-check"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AdminUpsellsPage() {
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
                  <h1 className="text-3xl font-bold tracking-tight">Manage Upsells</h1>
                  <p className="text-muted-foreground">
                    Create upsell offers to display in the shopping cart.
                  </p>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Upsell
                </Button>
              </div>
              
              <div className="grid gap-4">
                {/* Add upsell management interface here */}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminCheck>
  )
}
