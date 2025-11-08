import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RotateCcw, X } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onRestore: () => void
  onDelete: () => void
  disabled?: boolean
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onRestore,
  onDelete,
  disabled
}: BulkActionsBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0

  return (
    <div className="mb-4 p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            disabled={disabled}
          />
          <span className="text-sm font-medium">
            {selectedCount > 0 
              ? `${selectedCount} selected` 
              : 'Select all'}
          </span>
        </div>
        {selectedCount > 0 && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRestore}
              disabled={disabled}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore ({selectedCount})
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={onDelete}
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-2" />
              Delete Forever ({selectedCount})
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
