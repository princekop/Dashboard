"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, File, ChevronLeft, FolderPlus, MoreVertical, Pencil, Trash2, Archive, FileArchive, Bot, X, Loader2, Check, XCircle, Upload, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AISetupAssistant } from '@/components/ai-setup-assistant'

interface FileItem {
  name: string
  is_file: boolean
  size: number
  modified_at: string
}

interface FileManagerTabProps {
  serverId: string
}

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CodeChange {
  original: string
  modified: string
  accepted?: boolean
  explanation?: string
}

export function FileManagerTab({ serverId }: FileManagerTabProps) {
  const containerElement = typeof document !== 'undefined' ? document.getElementById('server-panel-container') : null
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('/')
  const [loading, setLoading] = useState(false)
  
  // File Editor
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editorLoading, setEditorLoading] = useState(false)
  
  // New Folder/File
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Rename
  const [showRename, setShowRename] = useState(false)
  const [renameItem, setRenameItem] = useState<string>('')
  const [renameTo, setRenameTo] = useState('')
  
  // AI Assistant
  const [showAI, setShowAI] = useState(false)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [codeChanges, setCodeChanges] = useState<CodeChange[]>([])
  
  // AI Setup Assistant
  const [showAISetup, setShowAISetup] = useState(false)

  useEffect(() => {
    loadFiles(currentPath)
  }, [currentPath, serverId])

  const loadFiles = async (path: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/files?directory=${encodeURIComponent(path)}`)
      const data = await res.json()
      if (data.data) {
        // Transform Pterodactyl API response structure
        const transformedFiles = data.data.map((item: any) => ({
          name: item.attributes?.name || item.name,
          is_file: item.attributes?.is_file ?? item.is_file,
          size: item.attributes?.size ?? item.size,
          modified_at: item.attributes?.modified_at || item.modified_at
        }))
        setFiles(transformedFiles)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`
    setCurrentPath(newPath)
  }

  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.length ? `/${parts.join('/')}` : '/')
  }

  const openFile = async (fileName: string) => {
    setEditorLoading(true)
    setShowEditor(true)
    try {
      const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
      const res = await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', file: filePath })
      })
      const data = await res.json()
      setFileContent(data.content || '')
      setSelectedFile(filePath)
    } catch (error) {
      console.error('Failed to open file:', error)
      setShowEditor(false)
    } finally {
      setEditorLoading(false)
    }
  }

  const saveFile = async () => {
    if (!selectedFile) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'write', file: selectedFile, content: fileContent })
      })
      setShowEditor(false)
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }

  const deleteFile = async (fileName: string, isFile: boolean) => {
    if (!confirm(`Delete ${fileName}?`)) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', root: currentPath, files: [fileName] })
      })
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-folder', root: currentPath, name: newFolderName })
      })
      setShowNewFolder(false)
      setNewFolderName('')
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const renameFile = async () => {
    if (!renameItem || !renameTo.trim()) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          root: currentPath,
          files: [{ from: renameItem, to: renameTo }]
        })
      })
      setShowRename(false)
      setRenameItem('')
      setRenameTo('')
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to rename:', error)
    }
  }

  const compressFiles = async (fileName: string) => {
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compress',
          root: currentPath,
          files: [fileName]
        })
      })
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to compress:', error)
    }
  }

  const decompressFile = async (fileName: string) => {
    try {
      const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decompress',
          root: currentPath,
          file: filePath
        })
      })
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to decompress:', error)
    }
  }

  const askAI = async () => {
    if (!aiInput.trim() || aiLoading) return

    const userMessage = aiInput
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setAiInput('')
    setAiLoading(true)

    try {
      // Build context
      let context = `Current directory: ${currentPath}\n\nFiles in directory:\n`
      files.forEach(f => {
        context += `- ${f.name} (${f.is_file ? 'file' : 'folder'}${f.is_file ? `, ${formatSize(f.size)}` : ''})\n`
      })

      if (selectedFile && showEditor) {
        context += `\n\nCurrently editing: ${selectedFile}\n\nFile content:\n${fileContent}`
      }

      const res = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
          fileContent: showEditor ? fileContent : null,
          fileName: selectedFile
        })
      })

      const data = await res.json()
      
      if (data.response) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        
        // Check if AI suggested code changes
        if (data.codeChanges && showEditor) {
          setCodeChanges(data.codeChanges)
          // Auto-preview changes in the editor
          if (data.isCodeChange) {
            let updatedContent = fileContent
            data.codeChanges.forEach((change: CodeChange) => {
              if (change.original && updatedContent.includes(change.original)) {
                updatedContent = updatedContent.replace(change.original, change.modified)
              }
            })
            // Store original for potential revert
            if (!sessionStorage.getItem(`original-${selectedFile}`)) {
              sessionStorage.setItem(`original-${selectedFile}`, fileContent)
            }
            setFileContent(updatedContent)
          }
        }
      }
    } catch (error) {
      console.error('AI request failed:', error)
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setAiLoading(false)
    }
  }

  const applyCodeChange = (index: number, accept: boolean) => {
    const change = codeChanges[index]
    if (accept) {
      // Already applied, just mark as accepted
      setCodeChanges(prev => {
        const updated = [...prev]
        updated[index] = { ...change, accepted: true }
        return updated
      })
    } else {
      // Revert this change
      if (change.original) {
        setFileContent(prev => prev.replace(change.modified, change.original))
      }
      setCodeChanges(prev => {
        const updated = [...prev]
        updated[index] = { ...change, accepted: false }
        return updated
      })
    }
  }
  
  const revertAllChanges = () => {
    const original = sessionStorage.getItem(`original-${selectedFile}`)
    if (original) {
      setFileContent(original)
      setCodeChanges([])
      sessionStorage.removeItem(`original-${selectedFile}`)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', currentPath)

        const res = await fetch(`/api/servers/${serverId}/files/upload`, {
          method: 'POST',
          body: formData
        })

        if (!res.ok) throw new Error('Upload failed')
        
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      setShowUpload(false)
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to upload:', error)
      alert('Failed to upload file(s)')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jar', 'zip', 'tar', 'gz', 'rar'].includes(ext || '')) return <FileArchive className="h-4 w-4 text-orange-500" />
    return <File className="h-4 w-4 text-blue-500" />
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-gradient-to-r from-purple-500/10 to-primary/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              ✨ AI Setup Assistant Available!
            </p>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
              Click "AI Setup" to automatically install plugins/mods, configure your server, and set everything up with just a simple request. Just tell the AI what you want!
            </p>
          </div>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              File Manager
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="default"
                onClick={() => setShowAISetup(true)}
                className="bg-gradient-to-r from-purple-600 to-primary"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Setup
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowAI(!showAI)}
                className={showAI ? 'bg-primary/10' : ''}
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Code
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewFolder(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* File List */}
            <div className={`space-y-4 transition-all ${showAI ? 'w-2/3' : 'w-full'}`}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
                <Button size="sm" variant="ghost" onClick={goBack} disabled={currentPath === '/'}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-mono text-xs">{currentPath}</span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 font-semibold text-xs grid grid-cols-12 gap-4">
                  <div className="col-span-6">NAME</div>
                  <div className="col-span-3">SIZE</div>
                  <div className="col-span-3">ACTIONS</div>
                </div>
                
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading...
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Empty directory</div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y">
                      {files.map((file, idx) => (
                        <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/50 transition-colors">
                          <div 
                            className="col-span-6 flex items-center gap-2 cursor-pointer"
                            onClick={() => file.name && (file.is_file ? openFile(file.name) : navigateToFolder(file.name))}
                          >
                            {file.is_file ? (
                              file.name && getFileIcon(file.name)
                            ) : (
                              <Folder className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-sm hover:text-primary transition-colors truncate">
                              {file.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="col-span-3 text-xs text-muted-foreground">
                            {file.is_file ? formatSize(file.size) : '-'}
                          </div>
                          <div className="col-span-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {file.is_file && file.name && (
                                  <DropdownMenuItem onClick={() => openFile(file.name)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  if (file.name) {
                                    setRenameItem(file.name)
                                    setRenameTo(file.name)
                                    setShowRename(true)
                                  }
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                {file.is_file && file.name?.endsWith('.zip') && (
                                  <DropdownMenuItem onClick={() => decompressFile(file.name)}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Extract
                                  </DropdownMenuItem>
                                )}
                                {file.name && !file.name.endsWith('.zip') && (
                                  <DropdownMenuItem onClick={() => compressFiles(file.name)}>
                                    <FileArchive className="h-4 w-4 mr-2" />
                                    Compress
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => file.name && deleteFile(file.name, file.is_file)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            {/* AI Assistant Panel */}
            {showAI && (
              <div className="w-1/3 border rounded-lg bg-card">
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">AI Assistant</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowAI(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px] p-3">
                  {aiMessages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Ask me about files, or request code reviews!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiMessages.map((msg, i) => (
                        <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block max-w-[90%] p-2 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask AI..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && askAI()}
                      disabled={aiLoading}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={askAI} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col" container={containerElement}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-4 w-4" />
              {selectedFile}
            </DialogTitle>
          </DialogHeader>
          
          {editorLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="flex gap-4 flex-1 min-h-0">
              <div className="flex-1 flex flex-col">
                <Textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="font-mono text-xs flex-1 min-h-[500px] resize-none"
                  spellCheck={false}
                />
              </div>
              
              {showAI && (
                <div className="w-80 border rounded-lg flex flex-col">
                  <div className="p-3 border-b">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Code Assistant</span>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1 p-3">
                    {codeChanges.length > 0 && (
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold">Code Changes Applied:</p>
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={revertAllChanges}>
                            Revert All
                          </Button>
                        </div>
                        {codeChanges.map((change, i) => (
                          <div key={i} className="border rounded overflow-hidden text-xs">
                            <div className="flex items-center justify-between px-2 py-1 bg-muted/50">
                              <span className="text-muted-foreground font-semibold">Change {i + 1}</span>
                              {change.accepted === undefined && (
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 px-2 text-green-600 hover:bg-green-500/10" 
                                    onClick={() => applyCodeChange(i, true)}
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 px-2 text-red-600 hover:bg-red-500/10" 
                                    onClick={() => applyCodeChange(i, false)}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {change.accepted === true && (
                                <Badge variant="default" className="h-5 text-xs bg-green-500">
                                  <Check className="h-3 w-3 mr-1" />
                                  Accepted
                                </Badge>
                              )}
                              {change.accepted === false && (
                                <Badge variant="destructive" className="h-5 text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              )}
                            </div>
                            {change.explanation && (
                              <div className="px-2 py-1 bg-blue-500/5 text-blue-700 dark:text-blue-300 border-b">
                                💡 {change.explanation}
                              </div>
                            )}
                            <div className="font-mono text-[10px]">
                              {change.original && (
                                <div className="bg-red-500/10 border-l-2 border-red-500">
                                  {change.original.split('\n').map((line, idx) => (
                                    <div key={idx} className="px-2 py-0.5 hover:bg-red-500/20">
                                      <span className="text-red-600 mr-2">-</span>
                                      <span className="text-red-700 dark:text-red-300">{line}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {change.modified && (
                                <div className="bg-green-500/10 border-l-2 border-green-500">
                                  {change.modified.split('\n').map((line, idx) => (
                                    <div key={idx} className="px-2 py-0.5 hover:bg-green-500/20">
                                      <span className="text-green-600 mr-2">+</span>
                                      <span className="text-green-700 dark:text-green-300">{line}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`text-xs mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block max-w-[90%] p-2 rounded ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  
                  <div className="p-2 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Review code..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && askAI()}
                        disabled={aiLoading}
                        className="text-xs"
                      />
                      <Button size="sm" onClick={askAI} disabled={aiLoading} className="px-2">
                        {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={saveFile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent container={containerElement}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Folder Name</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              placeholder="my-folder"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent container={containerElement}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <div>
            <Label>New Name</Label>
            <Input
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && renameFile()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>Cancel</Button>
            <Button onClick={renameFile}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent container={containerElement}>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current directory: <span className="font-mono text-primary">{currentPath}</span>
            </div>
            <div className="border-2 border-dashed rounded-lg p-8">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Click to select files or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-2">Support for multiple files</p>
                </div>
              </label>
            </div>
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Setup Assistant */}
      <AISetupAssistant 
        serverId={serverId} 
        open={showAISetup} 
        onOpenChange={setShowAISetup} 
      />
    </div>
  )
}
