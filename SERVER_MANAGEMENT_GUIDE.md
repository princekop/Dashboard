# Server Management - Quick Guide

## Navigation Flow

```
Dashboard
  └─> Services Page
        └─> Click "Manage" on any server
              └─> Server Management Area
                    ├─ New Dedicated Sidebar
                    └─ Individual Pages for each function
```

## Old vs New Structure

### OLD Structure (Tab-based)
```
/dashboard/servers/[id]
└─ Single page with tabs
   ├─ Console Tab
   ├─ Files Tab
   ├─ Databases Tab
   ├─ Backups Tab
   ├─ Ports Tab
   ├─ Startup Tab
   ├─ Plugins Tab
   ├─ Mods Tab
   ├─ Version Tab
   ├─ Settings Tab
   └─ Trash Tab
```

### NEW Structure (Page-based)
```
/dashboard/servers/[id]/
├─ console/      (default)
├─ files/
├─ databases/
├─ backups/
├─ ports/
├─ startup/
├─ plugins/
├─ mods/
├─ version/
├─ settings/
├─ trash/
└─ bots/         (dev mode only)
```

## Sidebar Layout

```
┌─────────────────────────────────┐
│ ← Back to Services              │
├─────────────────────────────────┤
│  🖥️  Server Name                │
│      ● Running                   │
│      ip:port                     │
├─────────────────────────────────┤
│ SERVER MANAGEMENT               │
│  ▸ Console                      │
│  ▸ File Manager                 │
│  ▸ Databases                    │
│  ▸ Backups                      │
│  ▸ Network                      │
│  ▸ Startup                      │
├─────────────────────────────────┤
│ ADVANCED                        │
│  ▸ Plugins                      │
│  ▸ Mods                         │
│  ▸ Version Manager              │
│  ▸ Settings                     │
│  ▸ Trash                        │
├─────────────────────────────────┤
│ DEVELOPER TOOLS                 │
│  ▸ Bot Controller               │
├─────────────────────────────────┤
│ Server ID: abc12345...          │
└─────────────────────────────────┘
```

## Page Header

Each page includes a unified header showing:

```
┌──────────────────────────────────────────────────────────────┐
│  🖥️  Server Name                                             │
│      Product Name • ● Running                                │
│      📡 ip.address:25565                                     │
│                                                              │
│  📊 Memory    💻 CPU      💾 Storage                        │
│     500 MB    12.5%      1500 MB                            │
│    /2048 MB   /100%     /10000 MB                           │
└──────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Real-time Updates
- Server status updates automatically
- Resource usage polls every 3 seconds
- Status indicators show running/starting/stopped

### 2. Navigation
- Sidebar stays visible on all pages
- Active page is highlighted
- Back button returns to services list

### 3. Organized Sections
- **Server Management**: Core functions
- **Advanced**: Power user features
- **Developer Tools**: Debug/testing tools

### 4. Consistent Layout
- Same header across all pages
- Unified styling and spacing
- Responsive design

## Common Tasks

### Access Console
```
Services → Click "Manage" → Automatically loads Console
```

### Manage Files
```
Console → Click "File Manager" in sidebar
```

### View Databases
```
Any Server Page → Click "Databases" in sidebar
```

### Configure Plugins
```
Any Server Page → Click "Plugins" in sidebar (Advanced section)
```

## Tips

1. **Bookmarks**: Each page has its own URL - bookmark frequently used pages
2. **Browser Navigation**: Use back/forward buttons to navigate between server functions
3. **Multiple Tabs**: Open different server functions in separate browser tabs
4. **Quick Access**: Status and IP shown in sidebar header for quick reference

## Development Notes

### Adding New Pages
1. Create new page in `/app/dashboard/servers/[id]/[function]/page.tsx`
2. Add navigation item to `components/server-management-sidebar.tsx`
3. Create or reuse tab component in `components/tabs/`

### Customizing Sidebar
Edit `components/server-management-sidebar.tsx`:
- Add items to `navItems` array
- Add to `advancedItems` for Advanced section
- Add to `devItems` for Developer Tools

### Modifying Layout
Edit `components/server-management-layout.tsx`:
- Adjust header layout
- Modify resource stats display
- Update polling intervals
