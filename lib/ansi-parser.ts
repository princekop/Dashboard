// ANSI color parser for console output
export interface ParsedLine {
  text: string
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

const ansiColorMap: { [key: string]: string } = {
  '30': '#000000', // Black
  '31': '#ef4444', // Red
  '32': '#22c55e', // Green
  '33': '#eab308', // Yellow
  '34': '#3b82f6', // Blue
  '35': '#a855f7', // Magenta
  '36': '#06b6d4', // Cyan
  '37': '#e5e7eb', // White
  '90': '#6b7280', // Bright Black (Gray)
  '91': '#f87171', // Bright Red
  '92': '#4ade80', // Bright Green
  '93': '#fbbf24', // Bright Yellow
  '94': '#60a5fa', // Bright Blue
  '95': '#c084fc', // Bright Magenta
  '96': '#22d3ee', // Bright Cyan
  '97': '#f9fafb', // Bright White
}

export function parseAnsiLine(line: string): ParsedLine[] {
  const segments: ParsedLine[] = []
  
  // Remove all ANSI escape sequences and control characters
  line = line
    .replace(/\x1b\[\?[0-9]+[hl]/g, '') // Remove mode switching (?1h, ?2004h, etc.)
    .replace(/\x1b\[K/g, '') // Clear line
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, (match) => {
      // Keep color codes, remove cursor movement
      if (match.match(/\x1b\[[0-9;]*m/)) return match
      return ''
    })
    .replace(/>\.\.\.\./g, '') // Remove >.... patterns
    .replace(/^>\s*/g, '') // Remove leading > prompt
    .trim()
  
  // Skip empty lines
  if (!line) return []
  
  // ANSI escape sequence regex
  const ansiRegex = /\x1b\[([0-9;]*)m/g
  
  let currentStyle: ParsedLine = { text: '' }
  let lastIndex = 0
  let match
  
  while ((match = ansiRegex.exec(line)) !== null) {
    // Add text before this escape code
    if (match.index > lastIndex) {
      currentStyle.text = line.substring(lastIndex, match.index)
      if (currentStyle.text) {
        segments.push({ ...currentStyle })
      }
    }
    
    // Parse the escape code
    const codes = match[1].split(';').filter(Boolean)
    currentStyle = { text: '' }
    
    for (const code of codes) {
      if (code === '0' || code === '') {
        // Reset
        currentStyle = { text: '' }
      } else if (code === '1') {
        currentStyle.bold = true
      } else if (code === '3') {
        currentStyle.italic = true
      } else if (code === '4') {
        currentStyle.underline = true
      } else if (ansiColorMap[code]) {
        currentStyle.color = ansiColorMap[code]
      }
    }
    
    lastIndex = ansiRegex.lastIndex
  }
  
  // Add remaining text
  if (lastIndex < line.length) {
    currentStyle.text = line.substring(lastIndex)
    if (currentStyle.text) {
      segments.push(currentStyle)
    }
  }
  
  // If no segments, return plain text
  if (segments.length === 0) {
    return [{ text: line, color: '#e5e7eb' }]
  }
  
  return segments
}

export function detectLogLevel(line: string): string {
  if (line.includes('ERROR') || line.includes('[E]')) return '#ef4444'
  if (line.includes('WARN') || line.includes('[W]')) return '#eab308'
  if (line.includes('INFO') || line.includes('[I]')) return '#3b82f6'
  if (line.includes('DEBUG') || line.includes('[D]')) return '#6b7280'
  if (line.includes('SUCCESS')) return '#22c55e'
  if (line.includes('>')) return '#a855f7' // Command prompt
  return '#e5e7eb' // Default white
}
