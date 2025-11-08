# Code Refactoring Guide

## 📁 New File Structure

This document explains the refactored code structure for better maintainability.

---

## 🗂️ Directory Organization

### `/lib/server-management/`
Central utilities and shared code for server management features.

```
lib/server-management/
├── index.ts                  # Central export file
├── types.ts                  # TypeScript type definitions
├── constants.ts              # Configuration constants
├── api-client.ts             # API communication layer
├── version-fetchers.ts       # Version fetching logic
└── helpers.ts                # Utility functions
```

### `/components/tabs/version-tab-components/`
Modular components for the version manager.

```
components/tabs/version-tab-components/
├── ServerTypeSelector.tsx    # Server type selection grid
├── VersionSelector.tsx       # Version dropdown
├── BuildSelector.tsx         # Build number dropdown
├── AlertMessages.tsx         # Warning/Error/Info alerts
└── InstallProgress.tsx       # Installation progress bar
```

### `/components/tabs/trash-tab-components/`
Modular components for the trash system.

```
components/tabs/trash-tab-components/
├── TrashItem.tsx            # Individual trash item card
├── BulkActionsBar.tsx       # Bulk selection actions
└── EmptyTrashState.tsx      # Empty state display
```

---

## 📦 Module Breakdown

### 1. **types.ts** - Type Definitions
All TypeScript interfaces and types in one place.

```typescript
export interface ServerType { ... }
export interface TrashItem { ... }
export interface ResourceStats { ... }
```

**Benefits:**
- Single source of truth for types
- Easy to maintain and update
- Auto-completion across the project

### 2. **constants.ts** - Configuration
All constants, configurations, and static data.

```typescript
export const SERVER_TYPES = [...]
export const API_ENDPOINTS = {...}
export const TIMEOUTS = {...}
```

**Benefits:**
- Easy to modify settings
- No magic numbers in code
- Environment-specific configs

### 3. **api-client.ts** - API Layer
Centralized API communication with error handling.

```typescript
export class ServerAPI {
  async installVersion(data) { ... }
  async getTrashItems() { ... }
  async restoreFromTrash(id) { ... }
}
```

**Benefits:**
- Consistent error handling
- Reusable across components
- Easy to mock for testing
- Single place to update endpoints

### 4. **version-fetchers.ts** - Version Logic
All version fetching logic separated from UI.

```typescript
export class VersionFetcher {
  static async fetchPaperVersions() { ... }
  static async fetchBuilds(type, version) { ... }
}
```

**Benefits:**
- Business logic separate from UI
- Testable independently
- Can be used in different contexts

### 5. **helpers.ts** - Utility Functions
Common helper functions used across the app.

```typescript
export function formatBytes(bytes) { ... }
export function formatRelativeTime(date) { ... }
export function debounce(fn, wait) { ... }
```

**Benefits:**
- DRY (Don't Repeat Yourself)
- Tested once, used everywhere
- Easy to optimize

---

## 🎯 Component Architecture

### Before Refactoring
```
version-tab-enhanced.tsx (550 lines)
├── All UI code
├── All business logic
├── All API calls
└── All helper functions
```

### After Refactoring
```
version-tab-refactored.tsx (150 lines)
├── Uses: ServerAPI
├── Uses: VersionFetcher
├── Uses: SERVER_TYPES constant
└── Renders: Modular sub-components
    ├── ServerTypeSelector
    ├── VersionSelector
    ├── BuildSelector
    ├── AlertMessages
    └── InstallProgress
```

**Benefits:**
- **Readability**: Each file has a single responsibility
- **Maintainability**: Easy to find and fix bugs
- **Testability**: Each piece can be tested independently
- **Reusability**: Components can be used elsewhere

---

## 🔄 Migration Path

### Option 1: Gradual Migration (Recommended)
Keep both old and new versions running side-by-side:

```typescript
// Old version still works
import { VersionTabEnhanced } from '@/components/tabs/version-tab-enhanced'

// New refactored version
import { VersionTabRefactored } from '@/components/tabs/version-tab-refactored'
```

### Option 2: Switch Immediately
Update imports to use refactored versions:

```typescript
// Before
<VersionTabEnhanced serverId={serverId} />

// After
<VersionTabRefactored serverId={serverId} />
```

---

## 📝 Usage Examples

### Using the API Client

```typescript
import { ServerAPI } from '@/lib/server-management'

const api = new ServerAPI(serverId)

// Install version
await api.installVersion({
  serverType: 'paper',
  version: '1.20.4',
  build: '497'
})

// Manage trash
const trash = await api.getTrashItems()
await api.restoreFromTrash(itemId)
await api.emptyTrash()
```

### Using Version Fetchers

```typescript
import { VersionFetcher } from '@/lib/server-management'

// Fetch versions
const versions = await VersionFetcher.fetchVersions('paper')

// Fetch builds
const builds = await VersionFetcher.fetchBuilds('paper', '1.20.4')
```

### Using Helpers

```typescript
import { 
  formatBytes, 
  formatRelativeTime,
  getStatusColor 
} from '@/lib/server-management'

formatBytes(1024)                    // "1 KB"
formatRelativeTime('2024-01-01')     // "2 days ago"
getStatusColor('running')            // "bg-green-500"
```

---

## 🧪 Testing

### Unit Tests (Example)

```typescript
// helpers.test.ts
import { formatBytes } from '@/lib/server-management'

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
  })
})

// api-client.test.ts
import { ServerAPI } from '@/lib/server-management'

describe('ServerAPI', () => {
  it('fetches trash items', async () => {
    const api = new ServerAPI('test-id')
    const items = await api.getTrashItems()
    expect(Array.isArray(items.items)).toBe(true)
  })
})
```

---

## ⚡ Performance Benefits

1. **Code Splitting**: Smaller bundle sizes
2. **Tree Shaking**: Unused code is removed
3. **Lazy Loading**: Load components on demand
4. **Memoization**: Helpers can be cached

---

## 🎨 Best Practices Implemented

### 1. Single Responsibility Principle
Each file/component does one thing well.

### 2. DRY (Don't Repeat Yourself)
Common code extracted to utilities.

### 3. Separation of Concerns
- UI components (presentation)
- Business logic (services)
- Data structures (types)
- Configuration (constants)

### 4. Dependency Injection
Components receive what they need via props.

### 5. Error Handling
Centralized error handling in API layer.

---

## 📊 Before vs After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Version Tab** | 550 lines | 150 lines (main) + 5 small components |
| **Trash Tab** | 280 lines | 120 lines (main) + 3 small components |
| **Code Reuse** | Copy-paste | Import from lib |
| **Testing** | Hard | Easy (isolated units) |
| **Onboarding** | Difficult | Clear structure |
| **Bug Fixing** | Search everywhere | Know where to look |

---

## 🚀 Future Improvements

### Easy to Add
- ✅ New server types (just add to constants)
- ✅ New API endpoints (add to api-client)
- ✅ New helpers (add to helpers.ts)
- ✅ New UI components (add to components/)

### Easy to Modify
- ✅ Change API URLs (update constants)
- ✅ Change timeouts (update constants)
- ✅ Change UI (update components)
- ✅ Change logic (update services)

---

## 📚 File Reference

### Core Utilities
```typescript
// Import everything
import * as ServerManagement from '@/lib/server-management'

// Or import specific items
import { 
  ServerAPI, 
  VersionFetcher, 
  formatBytes,
  SERVER_TYPES 
} from '@/lib/server-management'
```

### Components
```typescript
// Version Tab
import { VersionTabRefactored } from '@/components/tabs/version-tab-refactored'

// Trash Tab
import { TrashTabRefactored } from '@/components/tabs/trash-tab-refactored'

// Sub-components (if needed separately)
import { ServerTypeSelector } from '@/components/tabs/version-tab-components/ServerTypeSelector'
```

---

## 💡 Tips for Developers

1. **Start with types**: Define interfaces first
2. **Extract constants**: No magic values in code
3. **Create utilities**: Reusable functions in helpers
4. **Build services**: API calls in dedicated classes
5. **Compose components**: Small, focused UI components

---

## ✅ Checklist for Adding New Features

- [ ] Define types in `types.ts`
- [ ] Add constants to `constants.ts`
- [ ] Create API methods in `api-client.ts`
- [ ] Add business logic to appropriate service
- [ ] Create UI components in `components/`
- [ ] Write tests for new code
- [ ] Update documentation

---

## 🎓 Learning Resources

### Architecture Patterns
- **Service Layer Pattern**: `api-client.ts`, `version-fetchers.ts`
- **Component Composition**: Sub-components in folders
- **Utility Pattern**: `helpers.ts`
- **Constants Pattern**: `constants.ts`

### TypeScript Best Practices
- Strong typing with interfaces
- Type exports for reuse
- Generic types where applicable

---

This refactoring makes the codebase:
- ✅ **Easier to understand**
- ✅ **Easier to maintain**
- ✅ **Easier to test**
- ✅ **Easier to extend**
- ✅ **More professional**
