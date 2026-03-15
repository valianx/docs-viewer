import type { SearchResult } from '../../types'

interface SearchResultsProps {
  results: SearchResult[]
  searching: boolean
  onResultClick: (result: SearchResult) => void
}

/**
 * Displays semantic search results as a dropdown/overlay panel.
 * Shows file path, relevance score, and content preview for each result.
 */
export function SearchResults({ results, searching, onResultClick }: SearchResultsProps) {
  if (searching) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Searching...
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
          No results found
        </div>
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      {results.map((result, index) => (
        <div
          key={`${result.path}-${index}`}
          role="button"
          tabIndex={0}
          onClick={() => onResultClick(result)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onResultClick(result)
          }}
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
            transition: 'background 0.1s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }} className="truncate">
              {result.filename}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
              score: {result.score.toFixed(3)}
            </span>
          </div>
          {result.heading && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {result.heading}
            </div>
          )}
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {result.content.substring(0, 200)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }} className="truncate">
            {result.path}
          </div>
        </div>
      ))}
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  maxHeight: '400px',
  overflowY: 'auto',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '0 0 6px 6px',
  zIndex: 100,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
}
