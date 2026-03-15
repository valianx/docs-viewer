import { useState, useCallback } from 'react'
import { FileTree } from './components/Sidebar/FileTree'
import { ViewerPanel } from './components/Viewer/ViewerPanel'
import { Toolbar } from './components/Toolbar/Toolbar'
import { SettingsPanel } from './components/Settings/SettingsPanel'
import { useFileTree } from './hooks/useFileTree'
import { useConfig } from './hooks/useConfig'
import { useSearch } from './hooks/useSearch'
import type { TreeNode, SearchResult } from './types'

/**
 * Root application component.
 * Manages the three-panel layout: sidebar (file tree), toolbar, and viewer.
 */
export default function App() {
  const { tree, loading: treeLoading, error: treeError, refresh: refreshTree } = useFileTree()
  const { config, updateConfig, addPath, removePath } = useConfig()
  const { query, results, searching, isActive, setQuery, clearSearch } = useSearch()

  const [selectedFile, setSelectedFile] = useState<{ path: string; extension: string | null } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [gitLoading, setGitLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  /** Get the directory containing the selected file */
  const getSelectedDir = useCallback((): string | null => {
    if (!selectedFile) return null
    // Find the root path that contains this file
    if (!config) return null
    for (const rootPath of config.paths) {
      if (selectedFile.path.startsWith(rootPath)) {
        return rootPath
      }
    }
    return null
  }, [selectedFile, config])

  /** Handle file selection from the tree */
  const handleFileSelect = useCallback((node: TreeNode) => {
    setSelectedFile({
      path: node.path,
      extension: node.extension || null
    })
    clearSearch()
  }, [clearSearch])

  /** Handle clicking a search result */
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    const ext = result.path.endsWith('.excalidraw') ? '.excalidraw' : '.md'
    setSelectedFile({
      path: result.path,
      extension: ext
    })
    clearSearch()
  }, [clearSearch])

  /** Open selected file's directory in the configured editor */
  const handleOpenInEditor = useCallback(async () => {
    const dir = getSelectedDir()
    if (dir) {
      try {
        await window.api.openInEditor(dir)
      } catch (err) {
        setStatusMessage(`Failed to open editor: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }, [getSelectedDir])

  /** Commit and push changes in the selected file's repo */
  const handleCommitAndPush = useCallback(async () => {
    const dir = getSelectedDir()
    if (!dir) return

    setGitLoading(true)
    setStatusMessage(null)
    try {
      const result = await window.api.commitAndPush(dir)
      setStatusMessage(result.message)
      if (result.success) {
        await refreshTree()
      }
    } catch (err) {
      setStatusMessage(`Git failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setGitLoading(false)
    }
  }, [getSelectedDir, refreshTree])

  /** Handle adding a path (from settings) */
  const handleAddPath = useCallback(async (dirPath: string) => {
    await addPath(dirPath)
    await refreshTree()
  }, [addPath, refreshTree])

  /** Handle removing a path (from settings) */
  const handleRemovePath = useCallback(async (dirPath: string) => {
    await removePath(dirPath)
    await refreshTree()
  }, [removePath, refreshTree])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Toolbar
        selectedFilePath={selectedFile?.path || null}
        selectedDirPath={getSelectedDir()}
        query={query}
        searchResults={results}
        searching={searching}
        isSearchActive={isActive}
        onQueryChange={setQuery}
        onClearSearch={clearSearch}
        onSearchResultClick={handleSearchResultClick}
        onOpenInEditor={handleOpenInEditor}
        onCommitAndPush={handleCommitAndPush}
        onOpenSettings={() => setShowSettings(true)}
        gitLoading={gitLoading}
      />

      {/* Status message bar */}
      {statusMessage && (
        <div
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 4px' }}
          >
            &#10005;
          </button>
        </div>
      )}

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div
          style={{
            width: 'var(--sidebar-width)',
            minWidth: 'var(--sidebar-width)',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)'
            }}
          >
            Explorer
          </div>
          <FileTree
            tree={tree}
            loading={treeLoading}
            error={treeError}
            selectedPath={selectedFile?.path || null}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Viewer */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ViewerPanel
            filePath={selectedFile?.path || null}
            fileExtension={selectedFile?.extension || null}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && config && (
        <SettingsPanel
          config={config}
          onUpdateConfig={updateConfig}
          onAddPath={handleAddPath}
          onRemovePath={handleRemovePath}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
