"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import { ShoppingCart as ShoppingCartIcon, Server, Cpu, HardDrive, Zap, Check, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { ShoppingCart } from "@/components/shopping-cart"

interface Product {
  id: string
  name: string
  description: string | null
  ram: number
  cpu: number
  storage: number
  price: number
  billing: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart, cart } = useCart()

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Enhanced Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Hosting Plans
                      </h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                      Choose the perfect hosting plan for your needs with premium features and 24/7 support
                    </p>
                  </div>
                  <Button className="relative shadow-lg hover:shadow-xl transition-shadow">
                    <ShoppingCartIcon className="h-4 w-4 mr-2" />
                    Cart
                    {cart.length > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive">
                        {cart.length}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Server className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold mb-1">No products available</p>
                  <p className="text-sm text-muted-foreground">Check back later for new hosting plans!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => (
                  <Card 
                    key={product.id} 
                    className={`group relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      index === 1 ? 'border-primary/50 shadow-lg scale-105' : 'border-primary/20'
                    }`}
                  >
                    {index === 1 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground px-4 py-1 text-xs font-bold rounded-bl-lg flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        POPULAR
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <CardHeader className="relative z-10 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                          {product.name}
                        </CardTitle>
                        <Badge 
                          variant={index === 1 ? "default" : "secondary"} 
                          className="text-xs capitalize font-semibold"
                        >
                          {product.billing}
                        </Badge>
                      </div>
                      {product.description && (
                        <CardDescription className="text-sm">{product.description}</CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="relative z-10 flex-1 space-y-4">
                      {/* Features */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                            <Server className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{product.ram} GB RAM</p>
                            <p className="text-xs text-muted-foreground">High Performance Memory</p>
                          </div>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                            <Cpu className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{product.cpu * 100}% CPU</p>
                            <p className="text-xs text-muted-foreground">Dedicated Processing</p>
                          </div>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                            <HardDrive className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{product.storage} GB NVMe</p>
                            <p className="text-xs text-muted-foreground">Ultra-Fast SSD Storage</p>
                          </div>
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      </div>

                      {/* Price */}
                      <div className="pt-4 border-t border-primary/10">
                        <div className="flex items-end gap-2 mb-1">
                          <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            ₹{product.price}
                          </span>
                          <span className="text-muted-foreground text-sm pb-1.5">
                            /{product.billing === 'monthly' ? 'month' : product.billing === 'quarterly' ? 'quarter' : 'year'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Billed {product.billing}</p>
                      </div>
                    </CardContent>

                    <CardFooter className="relative z-10 flex gap-2 pt-4 border-t border-primary/10">
                      <Button 
                        className="flex-1 shadow-md hover:shadow-lg transition-all" 
                        variant={index === 1 ? "default" : "outline"}
                        onClick={() => addToCart(product.id)}
                      >
                        <ShoppingCartIcon className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant={index === 1 ? "outline" : "ghost"}
                        onClick={() => addToCart(product.id)}
                      >
                        Buy Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
      <ShoppingCart />
    </SidebarProvider>
  )
}
