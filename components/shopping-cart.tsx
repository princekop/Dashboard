"use client"

import { useCart } from "@/lib/cart-context"
import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Upsell {
  id: string
  title: string
  description: string
  type: string
  amount: number
  oldPrice: number
  newPrice: number
}

export function ShoppingCart() {
  const { cart, isCartOpen, closeCart, removeFromCart, updateQuantity } = useCart()
  const [upsells, setUpsells] = useState<Upsell[]>([])
  const [isFirstOrder, setIsFirstOrder] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isCartOpen) {
      fetch('/api/upsells')
        .then(res => res.json())
        .then(data => setUpsells(data.upsells || []))
      
      fetch('/api/orders/check-first')
        .then(res => res.json())
        .then(data => setIsFirstOrder(data.isFirstOrder))
    }
  }, [isCartOpen])

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const discount = isFirstOrder && subtotal >= 500 ? subtotal * 0.15 : 0
  const total = subtotal - discount

  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          })),
          totalAmount: subtotal,
          discount,
          finalAmount: total,
          isFirstOrder
        })
      })

      if (res.ok) {
        const data = await res.json()
        closeCart()
        router.push(`/dashboard/orders/${data.orderId}`)
      }
    } catch (error) {
      console.error('Checkout failed:', error)
    }
  }

  if (!isCartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={closeCart}
      />
      
      {/* Cart Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-xl font-bold">Your Cart</h2>
            <Badge variant="secondary">{cart.length}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">Add some products to get started!</p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.product.ram}GB RAM • {item.product.cpu} CPU • {item.product.storage}GB Storage
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        Billing: {item.product.billing}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-lg font-bold">₹{item.product.price * item.quantity}</p>
                  </div>
                </div>
              ))}

              {/* Upsell Section */}
              {upsells.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                    ⚡ Upgrade Your Order
                  </h3>
                  {upsells.slice(0, 2).map((upsell) => (
                    <div key={upsell.id} className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{upsell.title}</h4>
                          <p className="text-xs text-muted-foreground">{upsell.description}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Save {Math.round(((upsell.oldPrice - upsell.newPrice) / upsell.oldPrice) * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs line-through text-muted-foreground">₹{upsell.oldPrice}</span>
                          <span className="text-lg font-bold text-primary">₹{upsell.newPrice}</span>
                        </div>
                        <Button size="sm" className="text-xs">Add to Cart</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Totals */}
        {cart.length > 0 && (
          <div className="border-t p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">First Order Discount (15%)</span>
                    <span className="font-medium text-green-600">-₹{discount.toFixed(2)}</span>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">
                      🎉 First Order Discount Applied! You saved ₹{discount.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
              {!isFirstOrder && subtotal >= 500 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    💡 Tip: You could save ₹{(subtotal * 0.15).toFixed(2)} on your first order!
                  </p>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            <Button className="w-full" size="lg" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
