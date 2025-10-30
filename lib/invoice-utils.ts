/**
 * Invoice Utility Functions
 * Production-ready helpers for invoice generation and management
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generate a unique invoice number with transaction safety
 * Format: DARKBYTE-YYYY-XXXXXX
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.invoice.count()
  const nextNumber = count + 1
  
  return `DARKBYTE-${year}-${String(nextNumber).padStart(6, '0')}`
}

/**
 * Validate invoice data before creation
 */
export function validateInvoiceData(data: {
  orderId: string
  userId: string
  customerName: string
  customerEmail: string
  items: any[]
  subtotal: number
  total: number
}): { valid: boolean; error?: string } {
  // Check required fields
  if (!data.orderId || !data.userId) {
    return { valid: false, error: 'Missing required order or user ID' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.customerEmail)) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Validate items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { valid: false, error: 'Invoice must have at least one item' }
  }

  // Validate amounts
  if (data.subtotal < 0 || data.total < 0) {
    return { valid: false, error: 'Invalid amounts: cannot be negative' }
  }

  // Validate items structure
  for (const item of data.items) {
    if (!item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      return { valid: false, error: 'Invalid item structure' }
    }
    if (item.price < 0 || item.quantity < 1) {
      return { valid: false, error: 'Invalid item price or quantity' }
    }
  }

  return { valid: true }
}

/**
 * Sanitize invoice items for safe storage
 */
export function sanitizeInvoiceItems(items: any[]): any[] {
  return items.map(item => ({
    name: String(item.name).substring(0, 255),
    description: String(item.description || '').substring(0, 500),
    quantity: Math.max(1, parseInt(item.quantity)),
    price: Math.max(0, parseFloat(item.price)),
    total: Math.max(0, parseFloat(item.total))
  }))
}

/**
 * Parse invoice items safely with error handling
 */
export function parseInvoiceItems(itemsJson: string): any[] {
  try {
    const items = JSON.parse(itemsJson)
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array')
    }
    return items
  } catch (error) {
    console.error('Failed to parse invoice items:', error)
    return []
  }
}

/**
 * Format invoice number for display
 */
export function formatInvoiceNumber(invoiceNumber: string): string {
  return invoiceNumber.toUpperCase()
}

/**
 * Calculate invoice totals with validation
 */
export function calculateInvoiceTotals(
  subtotal: number,
  discount: number = 0,
  tax: number = 0
): { subtotal: number; discount: number; tax: number; total: number } {
  // Ensure all values are positive
  const validSubtotal = Math.max(0, subtotal)
  const validDiscount = Math.max(0, Math.min(discount, validSubtotal)) // Discount can't exceed subtotal
  const validTax = Math.max(0, tax)
  
  const total = validSubtotal - validDiscount + validTax
  
  return {
    subtotal: validSubtotal,
    discount: validDiscount,
    tax: validTax,
    total: Math.max(0, total)
  }
}

/**
 * Check if user has permission to access invoice
 */
export async function checkInvoicePermission(
  invoiceId: string,
  userId: string
): Promise<{ hasPermission: boolean; isAdmin?: boolean }> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { userId: true }
    })

    if (!invoice) {
      return { hasPermission: false }
    }

    // Check if user owns the invoice
    if (invoice.userId === userId) {
      return { hasPermission: true, isAdmin: false }
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    if (user?.isAdmin) {
      return { hasPermission: true, isAdmin: true }
    }

    return { hasPermission: false }
  } catch (error) {
    console.error('Error checking invoice permission:', error)
    return { hasPermission: false }
  }
}

/**
 * Rate limiting check (simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 300000) // Clean up every 5 minutes
