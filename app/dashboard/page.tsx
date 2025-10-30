"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Server, DollarSign, TrendingDown, ShoppingCart, Package, ExternalLink, Clock, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SocialCard from "@/components/social-card"
import AnimatedSearch from "@/components/animated-search"
import GhostLoader from "@/components/ghost-loader"
import WalkingLoader from "@/components/walking-loader"
import RedGhostLoader from "@/components/red-ghost-loader"
import RocketLoader from "@/components/rocket-loader"

interface DashboardStats {
  activeServices: number
  totalSpent: number
  totalSaved: number
  pendingOrders: number
}

interface RecentOrder {
  id: string
  status: string
  finalAmount: number
  createdAt: string
  items: Array<{
    product: {
      name: string
    }
  }>
}

interface ExpiringService {
  id: string
  name: string
  expiresAt: string
  product: {
    name: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [expiringServices, setExpiringServices] = useState<ExpiringService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      setStats(data.stats)
      setRecentOrders(data.recentOrders || [])
      setExpiringServices(data.expiringServices || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex items-center justify-center h-screen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of your services and spending
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/services')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <RedGhostLoader />
                    Active Services
                  </CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeServices || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view all services
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <GhostLoader />
                    Total Spent
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats?.totalSpent.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime spending
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <WalkingLoader />
                    Total Saved
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{stats?.totalSaved.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From discounts & offers
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/orders')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <RocketLoader />
                    Pending Orders
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting payment
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Social */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Quick Actions - Enhanced */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-xs">Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group" 
                    onClick={() => router.push('/dashboard/products')}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Browse Products</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group" 
                    onClick={() => router.push('/dashboard/services')}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                      <Server className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">View My Services</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 group" 
                    onClick={() => router.push('/dashboard/orders')}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">View All Orders</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Social Media Card - Enhanced */}
              <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <CardContent className="pt-6 pb-6 flex items-center justify-center relative z-10">
                  <SocialCard />
                </CardContent>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-xs font-semibold text-primary/80">Connect With Us</p>
                </div>
              </Card>

              {/* Expiring Services - Enhanced */}
              <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 via-background to-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500 animate-pulse" />
                    </div>
                    <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">
                      Expiring Soon
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">Services expiring within 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {expiringServices.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                        <Clock className="h-8 w-8 text-green-600 dark:text-green-500" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">All services are active</p>
                      <p className="text-xs text-muted-foreground mt-1">No expiring services</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expiringServices.map(service => (
                        <div 
                          key={service.id} 
                          className="group p-3 border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-semibold text-sm truncate">{service.name}</span>
                              <span className="text-xs text-muted-foreground truncate">{service.product.name}</span>
                            </div>
                            <Badge className="ml-2 bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 border-yellow-500/30 hover:bg-yellow-500/30">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {getDaysRemaining(service.expiresAt)}d
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders - Enhanced */}
            <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Recent Orders
                    </CardTitle>
                    <CardDescription className="text-xs">Your latest purchases</CardDescription>
                  </div>
                  <AnimatedSearch 
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search orders..."
                  />
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <ShoppingCart className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">No orders yet</p>
                    <p className="text-xs text-muted-foreground">Browse our products to get started!</p>
                    <Button 
                      onClick={() => router.push('/dashboard/products')}
                      className="mt-4"
                      size="sm"
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentOrders
                      .filter(order => 
                        searchTerm === "" || 
                        order.items.some(item => 
                          item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
                        ) ||
                        order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.id.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(order => (
                      <div 
                        key={order.id} 
                        className="group relative p-4 border border-primary/10 rounded-xl hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all duration-300 hover:shadow-md"
                        onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm truncate">
                                {order.items.map(item => item.product.name).join(', ')}
                              </span>
                              <Badge className={`${getStatusColor(order.status)} text-xs`}>
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <div className="font-bold text-lg">₹{order.finalAmount.toFixed(2)}</div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentOrders.filter(order => 
                      searchTerm === "" || 
                      order.items.some(item => 
                        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
                      ) ||
                      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      order.id.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && searchTerm !== "" && (
                      <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No orders found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search: "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
