import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RotateCcw, X, File, Folder, Package, Box } from 'lucide-react'
import { TrashItem as TrashItemType } from '@/lib/server-management'
import { formatBytes, formatRelativeTime } from '@/lib/server-management'

interface TrashItemProps {
  item: TrashItemType
  selected: boolean
  onToggle: () => void
  onRestore: () => void
  onDelete: () => void
  disabled?: boolean
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'file': return File
    case 'folder': return Folder
    case 'plugin': return Package
    case 'mod': return Box
    default: return File
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'file': return 'text-blue-500'
    case 'folder': return 'text-yellow-500'
    case 'plugin': return 'text-purple-500'
    case 'mod': return 'text-green-500'
    default: return 'text-gray-500'
  }
}

export function TrashItemCard({ 
  item, 
  selected, 
  onToggle, 
  onRestore, 
  onDelete,
  disabled 
}: TrashItemProps) {
  const TypeIcon = getTypeIcon(item.type)
  const typeColor = getTypeColor(item.type)

  return (
    <Card
      className={`border-primary/10 transition-all ${
        selected ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'hover:bg-muted/50'
      }`}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
          />
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TypeIcon className={`h-5 w-5 flex-shrink-0 ${typeColor}`} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                <span className="truncate">{item.path}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">{formatBytes(item.size)}</span>
                <span className="flex-shrink-0">•</span>
                <span className="flex-shrink-0">{formatRelativeTime(item.deletedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="secondary" className="capitalize">
              {item.type}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRestore}
              disabled={disabled}
              title="Restore"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              disabled={disabled}
              title="Delete permanently"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
