"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, MessageSquare, Settings } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const stats = [
    { title: "Total Products", value: "0", icon: Package, href: "/admin/products" },
    { title: "Pending Orders", value: "0", icon: ShoppingCart, href: "/admin/orders" },
    { title: "Total Users", value: "0", icon: Users, href: "/admin/users" },
    { title: "Active Chats", value: "0", icon: MessageSquare, href: "/admin/chats" },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your hosting platform from here
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/products/new" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors">
              <Package className="h-4 w-4" />
              <span>Add New Product</span>
            </Link>
            <Link href="/admin/orders" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors">
              <ShoppingCart className="h-4 w-4" />
              <span>View Pending Orders</span>
            </Link>
            <Link href="/admin/pterodactyl" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors">
              <Settings className="h-4 w-4" />
              <span>Configure Pterodactyl</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
