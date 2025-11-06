"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Folder, File, Download, Trash2, Edit, Plus, FolderPlus, Archive, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface FileItem {
  name: string
  is_file: boolean
  size: number
  modified_at: string
}

interface FileManagerTabProps {
  serverId: string
}

export function FileManagerTab({ serverId }: FileManagerTabProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('/')
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    loadFiles(currentPath)
  }, [currentPath, serverId])

  const loadFiles = async (path: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servers/${serverId}/files?directory=${encodeURIComponent(path)}`)
      const data = await res.json()
      setFiles(data.data || [])
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
      setShowEditor(true)
    } catch (error) {
      console.error('Failed to open file:', error)
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

  const deleteFile = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return
    try {
      await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', root: currentPath, files: [fileName] })
      })
      loadFiles(currentPath)
    } catch (error) {
      console.error('Failed to delete file:', error)
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              File Manager
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowNewFolder(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button size="sm" variant="ghost" onClick={goBack} disabled={currentPath === '/'}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-mono">{currentPath}</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 font-semibold text-sm grid grid-cols-12 gap-4">
                <div className="col-span-6">Name</div>
                <div className="col-span-3">Size</div>
                <div className="col-span-3">Actions</div>
              </div>
              
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : files.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Empty directory</div>
              ) : (
                <div className="divide-y">
                  {files.map((file, idx) => (
                    <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/50 transition-colors">
                      <div className="col-span-6 flex items-center gap-2">
                        {file.is_file ? (
                          <File className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Folder className="h-4 w-4 text-yellow-500" />
                        )}
                        <span 
                          className={file.is_file ? '' : 'cursor-pointer hover:text-primary'}
                          onClick={() => !file.is_file && navigateToFolder(file.name)}
                        >
                          {file.name}
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground">
                        {file.is_file ? formatSize(file.size) : '-'}
                      </div>
                      <div className="col-span-3 flex gap-1">
                        {file.is_file && (
                          <Button size="sm" variant="ghost" onClick={() => openFile(file.name)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteFile(file.name)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit File: {selectedFile}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="font-mono text-sm min-h-[400px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={saveFile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                placeholder="my-folder"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
