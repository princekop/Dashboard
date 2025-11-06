// Map to store only bot instances (mineflayer bots)
// The actual bot data is stored in database
export const botInstances = new Map<string, any>()

// Try to import mineflayer
let mineflayer: any = null
try {
  mineflayer = require('mineflayer')
} catch (error) {
  console.warn('Mineflayer not installed. Bot connections will be simulated.')
}

export { mineflayer }

// Helper to calculate expiry time
export function calculateExpiryTime(duration: string): Date | null {
  const now = new Date()
  switch (duration) {
    case '1m':
      return new Date(now.getTime() + 60 * 1000)
    case '5m':
      return new Date(now.getTime() + 5 * 60 * 1000)
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000)
    case '1d':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'never':
      return null
    default:
      return null
  }
}
