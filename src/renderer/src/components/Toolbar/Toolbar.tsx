import { useState } from 'react'
import { SearchBar } from '../Search/SearchBar'
import { SearchResults } from '../Search/SearchResults'
import type { SearchResult } from '../../types'

interface ToolbarProps {
  selectedFilePath: string | null
  selectedDirPath: string | null
  query: string
  searchResults: SearchResult[]
  searching: boolean
  isSearchActive: boolean
  onQueryChange: (value: string) => void
  onClearSearch: () => void
  onSearchResultClick: (result: SearchResult) => void
  onOpenInEditor: () => void
  onCommitAndPush: () => void
  onOpenSettings: () => void
  gitLoading: boolean
}

/**
 * Top toolbar containing search, editor launch, git commit, and settings buttons.
 */
export function Toolbar({
  selectedFilePath,
  selectedDirPath,
  query,
  searchResults,
  searching,
  isSearchActive,
  onQueryChange,
  onClearSearch,
  onSearchResultClick,
  onOpenInEditor,
  onCommitAndPush,
  onOpenSettings,
  gitLoading
}: ToolbarProps) {
  const [gitMessage, setGitMessage] = useState<string | null>(null)

  const handleCommitAndPush = async () => {
    setGitMessage(null)
    onCommitAndPush()
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        height: 'var(--toolbar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        gap: '8px',
        position: 'relative'
      }}
    >
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
        <SearchBar
          query={query}
          searching={searching}
          onQueryChange={onQueryChange}
          onClear={onClearSearch}
        />
        {isSearchActive && (
          <SearchResults
            results={searchResults}
            searching={searching}
            onResultClick={onSearchResultClick}
          />
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Open in Editor button */}
      <button
        onClick={onOpenInEditor}
        disabled={!selectedDirPath}
        title={selectedDirPath ? `Open in editor: ${selectedDirPath}` : 'Select a file first'}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          opacity: selectedDirPath ? 1 : 0.5
        }}
      >
        Open in Editor
      </button>

      {/* Commit & Push button */}
      <button
        onClick={handleCommitAndPush}
        disabled={!selectedDirPath || gitLoading}
        title={selectedDirPath ? `Commit & Push: ${selectedDirPath}` : 'Select a file first'}
        style={{
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          opacity: selectedDirPath && !gitLoading ? 1 : 0.5
        }}
      >
        {gitLoading ? 'Pushing...' : 'Commit & Push'}
      </button>

      {gitMessage && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {gitMessage}
        </span>
      )}

      {/* Settings button */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        style={{
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)'
        }}
      >
        &#9881;
      </button>
    </div>
  )
}
