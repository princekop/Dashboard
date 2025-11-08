# Server Management Improvements - Implementation Tasks

## Overview
This document tracks the comprehensive improvements needed for the server management system.

## Issues to Fix

### 1. Database API 404 Error ✅
- **Status**: Route exists, likely production configuration issue
- **Solution**: Add better error handling and CORS support for production
- **File**: `/app/api/servers/[id]/databases/route.ts`

### 2. Startup Area Editable ✅
- **Status**: Already editable
- **Current**: Users can edit environment variables that have `is_editable: true`
- **File**: `/components/tabs/startup-tab.tsx`

### 3. Enhanced Version Changer 🔄
- **Current Issues**:
  - Only has Paper and Purpur
  - Fabric and Vanilla are placeholders
  - No Bedrock support
  - Fetch fails in production (CORS/timeout)
- **Improvements Needed**:
  - Add Bedrock Edition support
  - Add Spigot support
  - Add Vanilla support (proper implementation)
  - Add Fabric support (proper implementation)  
  - Improve UI/UX with better visuals
  - Add timeout handling for API calls
  - Add caching for version lists
  - Better error messages
- **File**: `/components/tabs/version-tab-new.tsx`

### 4. Functional Trash System 🔄
- **Current**: Simulated/placeholder only
- **Needed**:
  - Backend API for trash operations
  - Integration with file manager
  - Auto-cleanup after 30 days
  - Restore functionality
  - Permanent delete functionality
- **Files**: 
  - `/components/tabs/trash-tab.tsx`
  - `/app/api/servers/[id]/trash/route.ts` (new)

### 5. AI Plugin Installation Fix 🔄
- **Issue**: Plugin installation fails in production
- **Likely Causes**:
  - Timeout on large plugin downloads
  - CORS issues
  - Server permission issues  
  - File upload size limits
- **Solution**:
  - Increase timeout
  - Stream downloads
  - Better error handling
  - Progress feedback
- **File**: `/app/api/servers/[id]/ai-install/route.ts`

### 6. File Manager Enhancements 🔄
- **Needed Features**:
  - Drag & drop file upload
  - Drag & drop to move files/folders
  - Mass selection (checkbox/shift+click)
  - Bulk operations (delete/move/download)
  - Better visual feedback
- **File**: `/components/tabs/file-manager-tab-new.tsx`

## Priority Order

1. **High Priority**:
   - Enhanced Version Changer with Bedrock + more types
   - File Manager drag & drop + mass operations
   - AI Plugin installation fix

2. **Medium Priority**:
   - Functional trash system
   - Production error handling improvements

3. **Low Priority**:
   - UI/UX polishing
   - Performance optimizations

## Implementation Status

- [ ] Enhanced Version Changer
- [ ] File Manager Drag & Drop
- [ ] File Manager Mass Operations
- [ ] Fix AI Plugin Installation
- [ ] Functional Trash System
- [ ] Production Error Handling
