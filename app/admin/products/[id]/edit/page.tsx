"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Upload, Link as LinkIcon, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const productId = params?.id || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    ram: '',
    cpu: '',
    storage: '',
    price: '',
    billing: 'monthly',
    duration: '30'
  })

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      const product = data.products?.find((p: any) => p.id === productId)
      
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          imageUrl: product.imageUrl || '',
          ram: product.ram.toString(),
          cpu: product.cpu.toString(),
          storage: product.storage.toString(),
          price: product.price.toString(),
          billing: product.billing,
          duration: product.duration.toString()
        })
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ram: parseInt(formData.ram),
          cpu: parseInt(formData.cpu),
          storage: parseInt(formData.storage),
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration)
        })
      })

      if (res.ok) {
        router.push('/admin/products')
      } else {
        alert('Failed to update product')
      }
    } catch (error) {
      console.error('Failed to update product:', error)
      alert('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In production, upload to cloud storage (Cloudinary, S3, etc.)
    const formData = new FormData()
    formData.append('file', file)

    // Placeholder - implement actual upload
    alert('Image upload will be implemented with cloud storage')
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Update the product information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Starter Plan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the hosting plan"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={imageMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageMode('url')}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Image URL
                </Button>
                <Button
                  type="button"
                  variant={imageMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageMode('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              {imageMode === 'url' ? (
                <Input
                  placeholder="https://example.com/image.jpg or video.mp4 or animation.gif"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              ) : (
                <Input
                  type="file"
                  accept="image/*,video/*,.gif"
                  onChange={handleImageUpload}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Supports images (JPG, PNG, GIF), videos (MP4, WebM), and animated GIFs
              </p>
              {formData.imageUrl && (
                <>
                  {formData.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video 
                      src={formData.imageUrl} 
                      className="mt-2 h-32 w-auto object-cover rounded-md border"
                      controls
                      muted
                    />
                  ) : (
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="mt-2 h-32 w-32 object-cover rounded-md border"
                    />
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ram">RAM (GB) *</Label>
                <Input
                  id="ram"
                  type="number"
                  placeholder="4"
                  value={formData.ram}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpu">CPU Cores *</Label>
                <Input
                  id="cpu"
                  type="number"
                  placeholder="2"
                  value={formData.cpu}
                  onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Storage (GB) *</Label>
                <Input
                  id="storage"
                  type="number"
                  placeholder="50"
                  value={formData.storage}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="499.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing">Billing Cycle *</Label>
                <Select
                  value={formData.billing}
                  onValueChange={(value) => setFormData({ ...formData, billing: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Server Duration (Days) *</Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Server will auto-suspend after this period
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/admin/products">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
