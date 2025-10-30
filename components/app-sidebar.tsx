"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  FileTextIcon,
  BriefcaseIcon,
  ShieldIcon,
  UsersIcon,
  ReceiptIcon,
  SettingsIcon,
  UserCircle,
  Bell,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { ShoppingCartIcon, PackageIcon } from "lucide-react"

const navItems = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: PackageIcon,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: ShoppingCartIcon,
    },
    {
      title: "Invoices",
      url: "/dashboard/invoices",
      icon: FileTextIcon,
    },
    {
      title: "Services",
      url: "/dashboard/services",
      icon: BriefcaseIcon,
    },
    {
      title: "Account",
      url: "/dashboard/account",
      icon: UserCircle,
    },
  ],
  adminMain: [
    {
      title: "Admin",
      icon: ShieldIcon,
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboardIcon,
        },
        {
          title: "Manage Products",
          url: "/admin/products",
          icon: PackageIcon,
        },
        {
          title: "Manage Orders",
          url: "/admin/orders",
          icon: ReceiptIcon,
        },
        {
          title: "Manage Services",
          url: "/admin/services",
          icon: BriefcaseIcon,
        },
        {
          title: "Announcements",
          url: "/admin/announcements",
          icon: Bell,
        },
        {
          title: "Customer Chats",
          url: "/admin/chats",
          icon: SettingsIcon,
        },
        {
          title: "Manage Users",
          url: "/admin/users",
          icon: UsersIcon,
        },
        {
          title: "Pterodactyl",
          url: "/admin/pterodactyl",
          icon: SettingsIcon,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const userData = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`,
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <img 
                  src="https://i.postimg.cc/JhLLjxH8/darkbyte-premium.gif" 
                  alt="DarkByte Premium" 
                  className="h-8 w-8 rounded-md object-contain"
                />
                <span className="text-base font-semibold">DarkByte Premium</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems.navMain} />
        {user?.isAdmin && <NavMain items={navItems.adminMain} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
