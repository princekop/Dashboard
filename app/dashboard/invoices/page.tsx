"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { FileText, Download, Eye, Sparkles, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Invoice {
  id: string
  invoiceNumber: string
  orderId: string
  customerName: string
  customerEmail: string
  total: number
  status: string
  createdAt: string
  paidDate: string | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices/my-invoices')
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Invoices
                  </h1>
                  <p className="text-muted-foreground">
                    Premium DarkByte invoices and billing history
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardDescription>Total Invoices</CardDescription>
                  <CardTitle className="text-3xl">{invoices.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardDescription>Paid Invoices</CardDescription>
                  <CardTitle className="text-3xl">
                    {invoices.filter(i => i.status === 'paid').length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardDescription>Total Spent</CardDescription>
                  <CardTitle className="text-3xl">
                    ₹{invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Invoice List */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : invoices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Invoices Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Your invoices will appear here after completing your first order.
                  </p>
                  <Link href="/dashboard/products">
                    <Button>
                      Browse Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-100 group-hover:scale-110 transition-transform">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-lg">{invoice.invoiceNumber}</h3>
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                {invoice.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {invoice.customerName} • {invoice.customerEmail}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Issued: {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {invoice.paidDate && ` • Paid: ${new Date(invoice.paidDate).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              ₹{invoice.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Amount</p>
                          </div>

                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <Button className="group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:text-white transition-all">
                              <Eye className="h-4 w-4 mr-2" />
                              View Invoice
                              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
