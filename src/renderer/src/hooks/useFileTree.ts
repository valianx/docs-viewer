import { useState, useEffect, useCallback } from 'react'
import type { TreeNode } from '../types'

/**
 * Hook for managing the file tree state.
 * Fetches the tree on mount and provides a refresh function.
 */
export function useFileTree() {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.getFileTree()
      setTree(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file tree')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { tree, loading, error, refresh }
}
