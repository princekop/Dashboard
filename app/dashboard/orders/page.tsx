"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Package, Eye, ShoppingBag, Calendar, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Order {
  id: string
  totalAmount: number
  discount: number
  finalAmount: number
  status: string
  isFirstOrder: boolean
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/my-orders')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Enhanced Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-7 w-7 text-primary" />
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    My Orders
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Track and manage all your orders in one place
                </p>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : orders.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Package className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-xl font-semibold mb-2">No orders yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here!</p>
                  <Button onClick={() => window.location.href = '/dashboard/products'}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => {
                  const StatusIcon = order.status === 'completed' ? CheckCircle : order.status === 'pending' ? Clock : XCircle
                  return (
                  <Card key={order.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-primary/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    <CardHeader className="relative z-10 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 px-3 py-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Subtotal</span>
                          <span className="font-semibold">₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Discount
                            </span>
                            <span className="font-semibold text-green-600">-₹{order.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold pt-2 border-t">
                          <span>Total Amount</span>
                          <span className="text-primary">₹{order.finalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" className="w-full hover:bg-primary/10 hover:border-primary/50 transition-all">
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )})}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
