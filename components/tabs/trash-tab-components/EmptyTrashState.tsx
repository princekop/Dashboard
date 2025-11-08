import { Trash2 } from 'lucide-react'

export function EmptyTrashState() {
  return (
    <div className="text-center py-16">
      <Trash2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
      <p className="text-lg font-semibold mb-2">Trash is empty</p>
      <p className="text-sm text-muted-foreground">
        Deleted items will appear here and can be restored within 30 days
      </p>
    </div>
  )
}
