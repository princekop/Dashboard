"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package, CreditCard, MessageSquare } from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    name: string
    description: string | null
    ram: number
    cpu: number
    storage: number
    imageUrl: string | null
  }
}

interface Order {
  id: string
  totalAmount: number
  discount: number
  finalAmount: number
  status: string
  paymentStatus: string
  paymentProof: string | null
  isFirstOrder: boolean
  createdAt: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const orderId = params?.orderId || ''
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      
      if (data.order) {
        setOrder(data.order)
      } else {
        router.push('/dashboard/orders')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      router.push('/dashboard/orders')
    } finally {
      setLoading(false)
    }
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handlePayNow = () => {
    router.push(`/checkout/${orderId}`)
  }

  const handleChat = () => {
    router.push(`/chat/${orderId}`)
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!order) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/orders">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
                <p className="text-muted-foreground">
                  Order #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Items
                    </CardTitle>
                    <CardDescription>Products in this order</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                        {item.product.imageUrl && (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.product.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{item.product.ram}GB RAM</span>
                            <span>{item.product.cpu} CPU</span>
                            <span>{item.product.storage}GB Storage</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm">Quantity: {item.quantity}</span>
                            <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Payment Proof */}
                {order.paymentProof && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Proof</CardTitle>
                      <CardDescription>Your uploaded payment screenshot</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <img 
                        src={order.paymentProof} 
                        alt="Payment proof" 
                        className="max-w-md rounded-md border"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {/* Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order Status</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Payment Status</span>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                    {order.isFirstOrder && (
                      <Badge variant="secondary" className="w-full justify-center">
                        First Order Discount Applied
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount (15%)</span>
                        <span>-₹{order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₹{order.finalAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.paymentStatus === 'pending' && !order.paymentProof && (
                      <Button onClick={handlePayNow} className="w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                    <Button onClick={handleChat} variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
