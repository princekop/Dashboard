# Server Management Structure

## Overview
Created a dedicated server management area with a new sidebar, separate pages for each management function, and proper component organization.

## New Components

### 1. ServerManagementSidebar (`components/server-management-sidebar.tsx`)
- **Purpose**: Dedicated sidebar for server management pages
- **Features**:
  - Displays server name, status, and IP/Port
  - Back button to return to services
  - Organized navigation groups:
    - **Server Management**: Console, Files, Databases, Backups, Network, Startup
    - **Advanced**: Plugins, Mods, Version Manager, Settings, Trash
    - **Developer Tools**: Bot Controller (dev mode only)
  - Real-time server status indicator
  - Active tab highlighting

### 2. ServerManagementLayout (`components/server-management-layout.tsx`)
- **Purpose**: Shared layout wrapper for all server management pages
- **Features**:
  - Loads server data and resources
  - Authorization checks
  - Resource polling (updates every 3 seconds)
  - Header with server information
  - Real-time resource stats (Memory, CPU, Storage)
  - Error boundary integration

## New Pages Structure

All server management pages are now under `/dashboard/servers/[id]/` with individual routes:

```
/dashboard/servers/[id]/
├── console/         → Console management
├── files/          → File manager
├── databases/      → Database management
├── backups/        → Backup management
├── ports/          → Network/Ports configuration
├── startup/        → Startup settings
├── plugins/        → Plugin manager
├── mods/           → Mod manager
├── version/        → Version manager
├── settings/       → Server settings
├── trash/          → Trash/Recycle bin
└── bots/           → Bot controller (dev mode)
```

### Page Components
Each page follows the same pattern:
```tsx
import { ServerManagementLayout } from '@/components/server-management-layout'
import { [TabComponent] } from '@/components/tabs/[tab-component]'

export default function [PageName]() {
  const params = useParams()
  const serverId = params.id as string

  return (
    <ServerManagementLayout serverId={serverId}>
      <div className="p-6">
        <[TabComponent] serverId={serverId} />
      </div>
    </ServerManagementLayout>
  )
}
```

## Updated Files

### 1. `/dashboard/servers/[id]/page.tsx`
- **Old**: Rendered full server management with tabs
- **New**: Redirects to `/dashboard/servers/[id]/console` by default

### 2. `/dashboard/services/page.tsx`
- **Updated**: "Manage" button now navigates to `/dashboard/servers/[id]/console`

## Benefits

### 1. **Better Navigation**
- Dedicated sidebar for server management
- Clear separation between dashboard and server management
- Persistent navigation across all server pages

### 2. **Improved UX**
- Each function has its own URL (bookmarkable)
- Better back/forward browser navigation
- Active page highlighting in sidebar

### 3. **Cleaner Architecture**
- Single responsibility components
- Shared layout reduces code duplication
- Easier to maintain and extend

### 4. **Performance**
- Only loads necessary tab content
- Shared resource polling in layout
- No tab switching state management needed

### 5. **SEO & Accessibility**
- Proper page titles for each function
- Better URL structure
- Clear navigation hierarchy

## Migration Notes

### What Changed
1. **Tabs removed**: Replaced with separate pages
2. **New sidebar**: Server-specific navigation
3. **New routes**: Individual URLs for each function
4. **Shared layout**: Common header and resource stats

### What Stayed the Same
1. **Tab components**: Reused existing tab components
2. **API routes**: No backend changes needed
3. **Functionality**: All features work the same
4. **Styling**: Consistent design language

## Usage

### Navigating to Server Management
```tsx
// From anywhere in the app
router.push(`/dashboard/servers/${serverId}/console`)
router.push(`/dashboard/servers/${serverId}/files`)
// etc.
```

### Accessing Server Data in Pages
The `ServerManagementLayout` provides the server context, so individual pages don't need to load server data themselves. They only need to implement their specific functionality.

## Future Enhancements

1. **Breadcrumbs**: Add breadcrumb navigation
2. **Search**: Global search across all server functions
3. **Shortcuts**: Keyboard shortcuts for common actions
4. **Mobile**: Optimize sidebar for mobile devices
5. **Tabs within Pages**: Individual pages can still use tabs if needed

## Testing Checklist

- [ ] Navigate to a server from services page
- [ ] Click each sidebar item and verify correct page loads
- [ ] Verify server status updates in sidebar
- [ ] Check back button returns to services
- [ ] Test with dev mode enabled/disabled
- [ ] Verify all tab components render correctly
- [ ] Check resource stats update every 3 seconds
- [ ] Test with different server states (running, stopped, starting)
