"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './auth-context'

interface CartItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    ram: number
    cpu: number
    storage: number
    price: number
    billing: string
  }
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (productId: string) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchCart = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        setCart(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      setCart([])
    }
  }, [user])

  const addToCart = async (productId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      if (res.ok) {
        await fetchCart()
        setIsCartOpen(true)
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchCart()
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
      if (res.ok) {
        await fetchCart()
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const clearCart = async () => {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
      })
      if (res.ok) {
        setCart([])
      }
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  }

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
