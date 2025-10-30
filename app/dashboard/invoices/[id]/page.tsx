"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { use, useEffect, useState, useRef } from "react"
import { Download, Printer, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useReactToPrint } from 'react-to-print'

interface Invoice {
  id: string
  invoiceNumber: string
  orderId: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    description: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  discount: number
  tax: number
  total: number
  status: string
  dueDate: string
  paidDate: string | null
  createdAt: string
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const invoiceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      const data = await res.json()
      setInvoice(data.invoice)
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  })

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

  if (!invoice) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex items-center justify-center h-screen">
            <p>Invoice not found</p>
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
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <Link href="/dashboard/invoices">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Invoices
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handlePrint}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Invoice Preview */}
            <Card className="max-w-4xl mx-auto w-full">
              <CardContent className="p-0">
                <div ref={invoiceRef} className="p-12 bg-white text-black print:p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-12 pb-8 border-b-4 border-gradient-to-r from-blue-600 to-purple-600" style={{ borderImage: 'linear-gradient(to right, #2563eb, #9333ea) 1' }}>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative">
                          <Sparkles className="h-12 w-12 text-blue-600" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
                        </div>
                        <div>
                          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            DarkByte
                          </h1>
                          <p className="text-sm text-gray-600 font-semibold">Premium Cloud Solutions</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-semibold">DarkByte Pvt. Ltd.</p>
                        <p>support@darkbyte.in</p>
                        <p>+91 88261 28886</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg mb-3">
                        <p className="text-xs font-semibold uppercase">Invoice</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(invoice.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Billing Info */}
                  <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-100">
                      <p className="text-xs font-bold text-blue-900 uppercase mb-3">Bill To</p>
                      <p className="font-bold text-lg text-gray-900">{invoice.customerName}</p>
                      <p className="text-sm text-gray-600 mt-1">{invoice.customerEmail}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-100">
                      <p className="text-xs font-bold text-purple-900 uppercase mb-3">Payment Details</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-bold ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                        {invoice.paidDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid On:</span>
                            <span className="font-semibold text-gray-900">
                              {new Date(invoice.paidDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          <th className="text-left p-4 font-bold rounded-tl-lg">Service</th>
                          <th className="text-center p-4 font-bold">Qty</th>
                          <th className="text-right p-4 font-bold">Price</th>
                          <th className="text-right p-4 font-bold rounded-tr-lg">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-4">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </td>
                            <td className="p-4 text-center font-semibold">{item.quantity}</td>
                            <td className="p-4 text-right font-semibold">₹{item.price.toFixed(2)}</td>
                            <td className="p-4 text-right font-bold text-blue-600">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-12">
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="flex justify-between text-sm py-2">
                        <span className="text-gray-600 font-medium">Subtotal:</span>
                        <span className="font-semibold">₹{invoice.subtotal.toFixed(2)}</span>
                      </div>
                      {invoice.discount > 0 && (
                        <div className="flex justify-between text-sm py-2 bg-green-50 px-4 rounded">
                          <span className="text-green-700 font-medium">Discount:</span>
                          <span className="font-bold text-green-700">-₹{invoice.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {invoice.tax > 0 && (
                        <div className="flex justify-between text-sm py-2">
                          <span className="text-gray-600 font-medium">Tax:</span>
                          <span className="font-semibold">₹{invoice.tax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 rounded-lg">
                        <span className="font-bold">Total Amount:</span>
                        <span className="font-black">₹{invoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-8 border-t-2 border-gray-200 text-center space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-100">
                      <p className="text-sm font-bold text-gray-900 mb-2">🚀 Thank you for choosing DarkByte Premium!</p>
                      <p className="text-xs text-gray-600">
                        Experience premium cloud hosting with 99.9% uptime guarantee and 24/7 expert support.
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
                        <span>📧 support@darkbyte.in</span>
                        <span>•</span>
                        <span>💬 Live Chat Available</span>
                        <span>•</span>
                        <span>🌐 www.darkbyte.in</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      This is a computer-generated invoice and does not require a signature.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
