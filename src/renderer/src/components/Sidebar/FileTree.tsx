import type { TreeNode as TreeNodeType } from '../../types'
import { TreeNode } from './TreeNode'

interface FileTreeProps {
  tree: TreeNodeType[]
  loading: boolean
  error: string | null
  selectedPath: string | null
  onFileSelect: (node: TreeNodeType) => void
}

/**
 * Sidebar component displaying the file tree.
 * Shows loading state, errors, or the navigable tree.
 */
export function FileTree({ tree, loading, error, selectedPath, onFileSelect }: FileTreeProps) {
  if (loading) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
        Loading file tree...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '16px', color: 'var(--error)', fontSize: '13px' }}>
        Error: {error}
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
        No paths configured. Open Settings to add document directories.
      </div>
    )
  }

  return (
    <div role="tree" style={{ padding: '4px 0', overflowY: 'auto', flex: 1 }}>
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  )
}
