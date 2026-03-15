import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownViewerProps {
  filePath: string
}

/**
 * Renders a markdown file as formatted HTML.
 * Uses react-markdown with GFM support and syntax highlighting.
 */
export function MarkdownViewer({ filePath }: MarkdownViewerProps) {
  const [content, setContent] = useState<string>('')
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
          setContent(text)
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
        Loading...
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

  return (
    <div className="markdown-content" style={{ overflowY: 'auto', height: '100%' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
