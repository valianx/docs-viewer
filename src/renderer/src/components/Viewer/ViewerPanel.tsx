import { MarkdownViewer } from './MarkdownViewer'
import { ExcalidrawViewer } from './ExcalidrawViewer'

interface ViewerPanelProps {
  filePath: string | null
  fileExtension: string | null
}

/**
 * Container component that routes to the appropriate viewer
 * based on the selected file's extension.
 */
export function ViewerPanel({ filePath, fileExtension }: ViewerPanelProps) {
  if (!filePath) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontSize: '15px',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '32px', opacity: 0.5 }}>&#128196;</span>
        <span>Select a file from the tree to view it</span>
      </div>
    )
  }

  if (fileExtension === '.excalidraw') {
    return <ExcalidrawViewer filePath={filePath} />
  }

  // Default to markdown viewer for .md files
  return <MarkdownViewer filePath={filePath} />
}
