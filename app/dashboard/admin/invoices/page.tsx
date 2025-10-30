"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AdminCheck } from "@/lib/admin-check"

export default function AdminInvoicesPage() {
  return (
    <AdminCheck>
      <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Manage Invoices</h1>
              <p className="text-muted-foreground">
                Manage all invoices across the platform.
              </p>
            </div>
            
            <div className="grid gap-4">
              {/* Add invoice management table here */}
            </div>
          </div>
        </div>
      </SidebarInset>
      </SidebarProvider>
    </AdminCheck>
  )
}
