"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Clock, CheckCircle2, MessageSquare } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

export default function CheckoutPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const orderId = params?.orderId || ''
  
  const [order, setOrder] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [countdown, setCountdown] = useState(15)
  const upiId = 'bytepro@upi'
  const payeeName = 'Byte Pro'

  // Build dynamic UPI string with note for easy reconciliation
  const upiDeepLink = useMemo(() => {
    if (!orderId || !order?.finalAmount) return ''
    const tn = encodeURIComponent(`Order ${orderId.slice(0,8)} - Rs ${order.finalAmount.toFixed(2)}`)
    const pn = encodeURIComponent(payeeName)
    const pa = encodeURIComponent(upiId)
    const am = encodeURIComponent(order.finalAmount.toFixed(2))
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`
  }, [orderId, order?.finalAmount])

  // Use a public QR generator to render the UPI string
  const qrImgUrl = useMemo(() => {
    if (!upiDeepLink) return ''
    const data = encodeURIComponent(upiDeepLink)
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${data}`
  }, [upiDeepLink])

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  useEffect(() => {
    if (waiting && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (waiting && countdown === 0) {
      router.push(`/chat/${orderId}`)
    }
  }, [waiting, countdown, orderId, router])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      setOrder(data.order)
      if (data.order.paymentProof) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('orderId', orderId)

    try {
      const res = await fetch('/api/upload/payment-proof', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        await updatePaymentProof(data.url)
      }
    } catch (error) {
      console.error('Failed to upload:', error)
      alert('Failed to upload payment proof')
    } finally {
      setUploading(false)
    }
  }

  const updatePaymentProof = async (imageUrl: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentProof: imageUrl })
      })

      if (res.ok) {
        setSubmitted(true)
        setWaiting(true)
      }
    } catch (error) {
      console.error('Failed to update payment proof:', error)
    }
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Payment</h1>
          <p className="text-muted-foreground">
            Order #{orderId.slice(0, 8)} • Total: ₹{order.finalAmount.toFixed(2)}
          </p>
        </div>

        {!submitted ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Scan QR code to pay via UPI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-6 rounded-lg flex justify-center">
                  {qrImgUrl ? (
                    <img
                      src={qrImgUrl}
                      alt="UPI QR Code"
                      className="w-64 h-64"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-muted rounded-md" />
                  )}
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">UPI ID: {upiId}</p>
                  <p className="text-2xl font-bold text-primary">₹{order.finalAmount.toFixed(2)}</p>
                  {order.discount > 0 && (
                    <p className="text-sm text-green-600">
                      You saved ₹{order.discount.toFixed(2)} 🎉
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Note attached to payment: <span className="font-medium">Order {orderId.slice(0,8)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload Payment Proof</CardTitle>
                <CardDescription>Screenshot of your payment confirmation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-proof">Payment Screenshot *</Label>
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional but recommended. Upload a clear screenshot showing the transaction details. If you skip, support may take longer to verify.
                  </p>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Uploading...
                  </div>
                )}

                <div className="bg-muted p-4 rounded-md space-y-2">
                  <h4 className="font-semibold text-sm">Order Summary</h4>
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <p className="font-medium">{item.product.name} × {item.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.product.ram}GB RAM • {item.product.cpu} CPU • {item.product.storage}GB
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { setWaiting(true); setCountdown(15); }} variant="outline">
                    Continue without upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !waiting ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold">Payment Proof Submitted!</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Your payment proof has been uploaded successfully. 
                Click below to continue to chat support.
              </p>
              <Button onClick={() => { setWaiting(true); setCountdown(15); }}>
                Continue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
              <Clock className="h-16 w-16 text-primary animate-pulse" />
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Please Wait...</h2>
                <p className="text-muted-foreground max-w-md">
                  Our admins are reviewing your payment and will verify it shortly. 
                  We appreciate your patience! 🙏
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{countdown}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to chat support...
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/chat/${orderId}`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Go to Chat Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
