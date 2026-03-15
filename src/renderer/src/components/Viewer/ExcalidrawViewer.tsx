import { useState, useEffect, lazy, Suspense } from 'react'

// Lazy load Excalidraw to reduce initial bundle size
const Excalidraw = lazy(async () => {
  const mod = await import('@excalidraw/excalidraw')
  return { default: mod.Excalidraw }
})

interface ExcalidrawViewerProps {
  filePath: string
}

/**
 * Renders an .excalidraw file in read-only mode.
 * Lazy-loads the Excalidraw component to minimize bundle impact.
 */
export function ExcalidrawViewer({ filePath }: ExcalidrawViewerProps) {
  const [sceneData, setSceneData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    window.api
      .readFile(filePath)
      .then((text) => {
        if (!cancelled) {
          try {
            const parsed = JSON.parse(text)
            setSceneData(parsed)
          } catch {
            setError('Invalid Excalidraw file format')
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to read file')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [filePath])

  if (loading) {
    return (
      <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
        Loading diagram...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '24px', color: 'var(--error)' }}>
        Error: {error}
      </div>
    )
  }

  if (!sceneData) {
    return null
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Suspense
        fallback={
          <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
            Loading Excalidraw viewer...
          </div>
        }
      >
        <Excalidraw
          initialData={{
            elements: sceneData.elements as never[],
            appState: {
              ...(sceneData.appState as Record<string, unknown> || {}),
              viewModeEnabled: true,
              theme: 'dark'
            }
          }}
          viewModeEnabled={true}
          theme="dark"
        />
      </Suspense>
    </div>
  )
}
