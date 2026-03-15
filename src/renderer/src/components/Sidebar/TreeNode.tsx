import { useState } from 'react'
import type { TreeNode as TreeNodeType } from '../../types'

interface TreeNodeProps {
  node: TreeNodeType
  depth: number
  selectedPath: string | null
  onFileSelect: (node: TreeNodeType) => void
}

/**
 * Renders a single node in the file tree.
 * Directories are collapsible; files are selectable.
 */
export function TreeNode({ node, depth, selectedPath, onFileSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1)
  const isSelected = node.path === selectedPath
  const isDirectory = node.type === 'directory'

  const icon = isDirectory
    ? expanded
      ? '\u25BE'  // down triangle
      : '\u25B8'  // right triangle
    : node.extension === '.excalidraw'
      ? '\u25C7'  // diamond
      : '\u25A1'  // square (document)

  const handleClick = () => {
    if (isDirectory) {
      setExpanded(!expanded)
    } else {
      onFileSelect(node)
    }
  }

  return (
    <div>
      <div
        role="treeitem"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '3px 8px',
          paddingLeft: `${depth * 16 + 8}px`,
          cursor: 'pointer',
          backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
          borderRadius: '3px',
          fontSize: '13px',
          userSelect: 'none',
          gap: '6px'
        }}
      >
        <span style={{
          fontSize: '10px',
          width: '12px',
          textAlign: 'center',
          opacity: isDirectory ? 1 : 0.6
        }}>
          {icon}
        </span>
        <span className="truncate" style={{ flex: 1 }}>
          {node.name}
        </span>
      </div>
      {isDirectory && expanded && node.children && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
