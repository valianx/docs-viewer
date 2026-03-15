interface SearchBarProps {
  query: string
  searching: boolean
  onQueryChange: (value: string) => void
  onClear: () => void
}

/**
 * Search input component with clear button.
 * Triggers debounced semantic search via the useSearch hook.
 */
export function SearchBar({ query, searching, onQueryChange, onClear }: SearchBarProps) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
      <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>
        &#128269;
      </span>
      <input
        type="text"
        placeholder="Search docs..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        style={{
          width: '100%',
          paddingLeft: '32px',
          paddingRight: query ? '32px' : '10px',
          height: '32px',
          fontSize: '13px'
        }}
      />
      {searching && (
        <span style={{
          position: 'absolute',
          right: query ? '32px' : '10px',
          color: 'var(--text-muted)',
          fontSize: '12px'
        }}>
          ...
        </span>
      )}
      {query && (
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '6px',
            padding: '2px 6px',
            fontSize: '14px',
            color: 'var(--text-muted)'
          }}
          aria-label="Clear search"
        >
          &#10005;
        </button>
      )}
    </div>
  )
}
