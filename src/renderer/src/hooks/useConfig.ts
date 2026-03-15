import { useState, useEffect, useCallback } from 'react'
import type { AppConfig } from '../types'

/**
 * Hook for managing application configuration.
 * Loads config on mount and provides update functions.
 */
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.getConfig()
      setConfig(result)
    } catch (err) {
      console.error('Failed to load config:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const updateConfig = useCallback(async (updates: Partial<AppConfig>) => {
    await window.api.updateConfig(updates)
    setConfig((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  const addPath = useCallback(async (dirPath: string) => {
    await window.api.addPath(dirPath)
    await loadConfig()
  }, [loadConfig])

  const removePath = useCallback(async (dirPath: string) => {
    await window.api.removePath(dirPath)
    await loadConfig()
  }, [loadConfig])

  return { config, loading, updateConfig, addPath, removePath, refresh: loadConfig }
}
