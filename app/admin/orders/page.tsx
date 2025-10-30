"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Order {
  id: string
  user: { name: string | null; email: string }
  totalAmount: number
  discount: number
  finalAmount: number
  status: string
  paymentStatus: string
  paymentProof: string | null
  isFirstOrder: boolean
  createdAt: string
  items: Array<{
    product: { name: string; ram: number; cpu: number; storage: number; duration: number }
    quantity: number
  }>
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders?filter=${filter}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (orderId: string) => {
    if (!confirm('Verify this payment and create server?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: 'POST'
      })
      
      if (res.ok) {
        alert('Payment verified! Server is being created...')
        fetchOrders()
      } else {
        alert('Failed to verify payment')
      }
    } catch (error) {
      console.error('Failed to verify payment:', error)
      alert('Failed to verify payment')
    } finally {
      setLoading(false)
    }
  }

  const rejectPayment = async (orderId: string) => {
    if (!confirm('Reject this payment?')) return
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: 'POST'
      })
      
      if (res.ok) {
        alert('Payment rejected')
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to reject payment:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
          <p className="text-muted-foreground">
            Verify payments and manage orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending ({orders.filter(o => o.paymentStatus === 'pending').length})
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Orders
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No {filter === 'pending' ? 'pending' : ''} orders</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      {order.user.name || order.user.email} • {new Date(order.createdAt).toLocaleString()}
                      {order.isFirstOrder && (
                        <Badge variant="secondary" className="ml-2">First Order</Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <h4 className="font-semibold text-sm">Order Items:</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted p-3 rounded-md text-sm">
                      <div>
                        <p className="font-medium">{item.product.name} × {item.quantity}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.product.ram}GB RAM • {item.product.cpu} CPU • {item.product.storage}GB Storage • {item.product.duration} days
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
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
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>₹{order.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {order.paymentProof && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">Payment Proof:</h4>
                    <img 
                      src={order.paymentProof} 
                      alt="Payment proof" 
                      className="max-w-xs rounded-md border"
                    />
                  </div>
                )}

                {order.paymentStatus === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => verifyPayment(order.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Verify & Create Server
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => rejectPayment(order.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Link href={`/admin/chats?orderId=${order.id}`}>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
