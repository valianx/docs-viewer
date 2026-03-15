import { useState } from 'react'
import type { AppConfig } from '../../types'

interface SettingsPanelProps {
  config: AppConfig
  onUpdateConfig: (updates: Partial<AppConfig>) => Promise<void>
  onAddPath: (dirPath: string) => Promise<void>
  onRemovePath: (dirPath: string) => Promise<void>
  onClose: () => void
}

/**
 * Settings panel for managing app configuration.
 * Allows adding/removing document paths and choosing the preferred editor.
 */
export function SettingsPanel({ config, onUpdateConfig, onAddPath, onRemovePath, onClose }: SettingsPanelProps) {
  const [adding, setAdding] = useState(false)

  const handleAddPath = async () => {
    setAdding(true)
    try {
      const selected = await window.api.selectDirectory()
      if (selected) {
        await onAddPath(selected)
      }
    } finally {
      setAdding(false)
    }
  }

  const handleEditorChange = async (editor: 'code' | 'antigravity') => {
    await onUpdateConfig({ editor })
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Settings</h2>
          <button onClick={onClose} style={{ fontSize: '18px', padding: '4px 8px', color: 'var(--text-muted)' }}>
            &#10005;
          </button>
        </div>

        {/* Document Paths */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Document Paths
          </h3>
          {config.paths.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              No paths configured yet. Add a directory to get started.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', marginBottom: '12px' }}>
              {config.paths.map((p) => (
                <li
                  key={p}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    marginBottom: '4px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  <span className="truncate" style={{ flex: 1, marginRight: '8px' }}>
                    {p}
                  </span>
                  <button
                    onClick={() => onRemovePath(p)}
                    style={{ color: 'var(--error)', fontSize: '12px', padding: '2px 8px' }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={handleAddPath}
            disabled={adding}
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '13px',
              opacity: adding ? 0.6 : 1
            }}
          >
            {adding ? 'Selecting...' : '+ Add Path'}
          </button>
        </section>

        {/* Editor Preference */}
        <section>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Preferred Editor
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['code', 'antigravity'] as const).map((ed) => (
              <button
                key={ed}
                onClick={() => handleEditorChange(ed)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: config.editor === ed ? 'var(--accent)' : 'var(--bg-surface)',
                  color: config.editor === ed ? 'var(--bg-primary)' : 'var(--text-primary)',
                  border: `1px solid ${config.editor === ed ? 'var(--accent)' : 'var(--border)'}`
                }}
              >
                {ed === 'code' ? 'VS Code' : 'Antigravity'}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200
}

const panelStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderRadius: '8px',
  padding: '24px',
  width: '500px',
  maxWidth: '90vw',
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid var(--border)'
}
