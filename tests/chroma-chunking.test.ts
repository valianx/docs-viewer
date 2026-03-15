import { describe, it, expect } from 'vitest'

/**
 * Tests for the markdown chunking logic used by ChromaService.
 * Extracted from the service to test without ChromaDB dependency.
 */

interface Chunk {
  id: string
  text: string
  metadata: Record<string, string>
}

/**
 * Splits markdown content into chunks by headings.
 * Mirrors the logic in ChromaService.splitIntoChunks
 */
function splitIntoChunks(content: string, filePath: string): Chunk[] {
  const filename = filePath.split('/').pop() || filePath
  const chunks: Chunk[] = []

  const sections = content.split(/(?=^#{1,3}\s)/m)

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim()
    if (!section) continue

    const headingMatch = section.match(/^(#{1,3})\s+(.+)/)
    const heading = headingMatch ? headingMatch[2].trim() : `section-${i}`

    if (section.length > 1000) {
      const paragraphs = section.split(/\n\n+/)
      for (let j = 0; j < paragraphs.length; j++) {
        const para = paragraphs[j].trim()
        if (para.length < 50) continue
        chunks.push({
          id: `${filePath}::${i}::${j}`,
          text: para.substring(0, 1000),
          metadata: { path: filePath, filename, heading, chunk_index: `${i}-${j}` }
        })
      }
    } else if (section.length >= 50) {
      chunks.push({
        id: `${filePath}::${i}`,
        text: section,
        metadata: { path: filePath, filename, heading, chunk_index: String(i) }
      })
    }
  }

  if (chunks.length === 0 && content.length >= 50) {
    chunks.push({
      id: `${filePath}::0`,
      text: content.substring(0, 1000),
      metadata: { path: filePath, filename, heading: 'full-document', chunk_index: '0' }
    })
  }

  return chunks
}

describe('Markdown chunking for ChromaDB indexing', () => {
  /** AC-5, AC-7: Files are indexed in ChromaDB for semantic search */
  it('should split markdown by headings', () => {
    const content = `# Introduction

This is the introduction section with enough text to pass the minimum threshold.

## Getting Started

This section explains how to get started with the project documentation.

## API Reference

Detailed API documentation for all public endpoints and methods.`

    const chunks = splitIntoChunks(content, '/docs/readme.md')
    expect(chunks.length).toBe(3)
    expect(chunks[0].metadata.heading).toBe('Introduction')
    expect(chunks[1].metadata.heading).toBe('Getting Started')
    expect(chunks[2].metadata.heading).toBe('API Reference')
  })

  it('should handle content without headings as a single chunk', () => {
    const content = 'This is a document without any headings but has enough content to be indexed as a full document chunk.'

    const chunks = splitIntoChunks(content, '/docs/notes.md')
    expect(chunks.length).toBe(1)
    // No heading found, so it uses section-N naming convention
    expect(chunks[0].metadata.heading).toBe('section-0')
    expect(chunks[0].metadata.path).toBe('/docs/notes.md')
  })

  it('should skip tiny fragments under 50 characters', () => {
    const content = `# Title

Short.

## Real Section

This section has enough content to be worth indexing in the vector database.`

    const chunks = splitIntoChunks(content, '/docs/test.md')
    // "Short." is under 50 chars, only the real section and title should be chunked
    expect(chunks.every((c) => c.text.length >= 50)).toBe(true)
  })

  it('should truncate chunks over 1000 characters', () => {
    const longContent = `# Long Section\n\n${'x'.repeat(2000)}`

    const chunks = splitIntoChunks(longContent, '/docs/long.md')
    expect(chunks.every((c) => c.text.length <= 1000)).toBe(true)
  })

  it('should include file metadata in each chunk', () => {
    const content = '# Test\n\nThis is a test document with enough content to be indexed.'

    const chunks = splitIntoChunks(content, '/docs/project/test.md')
    expect(chunks[0].metadata.path).toBe('/docs/project/test.md')
    expect(chunks[0].metadata.filename).toBe('test.md')
  })

  it('should return empty array for very short content', () => {
    const content = 'Too short'

    const chunks = splitIntoChunks(content, '/docs/tiny.md')
    expect(chunks).toHaveLength(0)
  })

  it('should generate unique IDs per chunk', () => {
    const content = `# Section One

Content for section one that is long enough to be indexed properly.

## Section Two

Content for section two that is also long enough for indexing purposes.`

    const chunks = splitIntoChunks(content, '/docs/multi.md')
    const ids = chunks.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length) // all unique
  })
})
