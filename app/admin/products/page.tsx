"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Product {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  ram: number
  cpu: number
  storage: number
  price: number
  billing: string
  duration: number
  isActive: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      fetchProducts()
    } catch (error) {
      console.error('Failed to toggle product:', error)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Manage Products</h1>
          <p className="text-muted-foreground">
            Create and manage hosting products
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No products yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first hosting product</p>
            <Link href="/admin/products/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className={!product.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                {product.imageUrl && (
                  product.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video
                      src={product.imageUrl}
                      className="w-full h-32 object-cover rounded-md mb-4"
                      controls
                      muted
                    />
                  ) : (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-md mb-4"
                    />
                  )
                )}
                <div className="flex items-center justify-between">
                  <CardTitle>{product.name}</CardTitle>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{product.ram}GB</p>
                    <p className="text-xs text-muted-foreground">RAM</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{product.cpu}</p>
                    <p className="text-xs text-muted-foreground">CPU</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{product.storage}GB</p>
                    <p className="text-xs text-muted-foreground">Storage</p>
                  </div>
                </div>
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-bold">₹{product.price}/{product.billing}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{product.duration} days</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link href={`/admin/products/${product.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  onClick={() => toggleActive(product.id, product.isActive)}
                >
                  {product.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button 
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteProduct(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
