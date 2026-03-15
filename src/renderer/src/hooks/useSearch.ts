import { useState, useCallback, useRef } from 'react'
import type { SearchResult } from '../types'

/**
 * Hook for managing semantic search state.
 * Handles debounced search queries and result management.
 */
export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsActive(false)
      return
    }

    setSearching(true)
    setIsActive(true)
    try {
      const searchResults = await window.api.searchDocs(searchQuery)
      setResults(searchResults)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        search(value)
      }, 300)
    },
    [search]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setIsActive(false)
  }, [])

  return {
    query,
    results,
    searching,
    isActive,
    setQuery: handleQueryChange,
    clearSearch
  }
}
