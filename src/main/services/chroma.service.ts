import { ChildProcess, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getChromaDataPath } from '../utils/paths'
import type { SearchResult, IndexingStatus } from '../../shared/types'

/**
 * Service managing ChromaDB lifecycle, document indexing, and semantic search.
 *
 * ChromaDB's JS client requires a running server, so this service spawns
 * a `chroma run` process internally. The server is invisible to the user.
 */
export class ChromaService {
  private chromaProcess: ChildProcess | null = null
  private client: unknown = null
  private collection: unknown = null
  private embedder: unknown = null
  private isReady = false
  private indexingStatus: IndexingStatus = {
    isIndexing: false,
    filesProcessed: 0,
    totalFiles: 0
  }

  /**
   * Starts the ChromaDB server as a child process and initializes the client.
   * @param port - Port for the ChromaDB server (default: 6333)
   */
  async start(port = 6333): Promise<void> {
    const chromaDataPath = getChromaDataPath()
    if (!fs.existsSync(chromaDataPath)) {
      fs.mkdirSync(chromaDataPath, { recursive: true })
    }

    try {
      // Try to spawn chroma server
      this.chromaProcess = spawn('chroma', ['run', '--path', chromaDataPath, '--port', String(port)], {
        stdio: 'pipe',
        shell: process.platform === 'win32'
      })

      this.chromaProcess.on('error', (err) => {
        console.error('ChromaDB process error:', err.message)
        console.warn('ChromaDB is not available. Semantic search will be disabled.')
        this.isReady = false
      })

      this.chromaProcess.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString()
        // ChromaDB logs startup info to stderr
        if (msg.includes('Application startup complete')) {
          console.log('ChromaDB server is ready')
        }
      })

      // Wait for the server to be ready
      await this.waitForReady(port)

      // Initialize client
      const { ChromaClient } = await import('chromadb')
      this.client = new ChromaClient({ path: `http://localhost:${port}` })

      // Initialize default embedding function
      try {
        const { DefaultEmbeddingFunction } = await import('chromadb-default-embed')
        this.embedder = new DefaultEmbeddingFunction()
      } catch {
        console.warn('chromadb-default-embed not available, using ChromaDB without embeddings')
      }

      // Get or create collection
      const client = this.client as {
        getOrCreateCollection: (params: { name: string; embeddingFunction?: unknown }) => Promise<unknown>
      }
      this.collection = await client.getOrCreateCollection({
        name: 'docs-viewer',
        ...(this.embedder ? { embeddingFunction: this.embedder } : {})
      })

      this.isReady = true
      console.log('ChromaDB service initialized successfully')
    } catch (error) {
      console.error('Failed to start ChromaDB:', error)
      this.isReady = false
    }
  }

  /**
   * Stops the ChromaDB server process.
   */
  async stop(): Promise<void> {
    if (this.chromaProcess) {
      this.chromaProcess.kill('SIGTERM')
      this.chromaProcess = null
    }
    this.isReady = false
    this.client = null
    this.collection = null
  }

  /**
   * Indexes all markdown files in the given directory paths.
   * Reads each file, splits into chunks, and upserts to ChromaDB.
   * @param filePaths - Array of absolute file paths to index
   */
  async indexFiles(filePaths: string[]): Promise<void> {
    if (!this.isReady || !this.collection) {
      console.warn('ChromaDB not ready, skipping indexing')
      return
    }

    this.indexingStatus = {
      isIndexing: true,
      filesProcessed: 0,
      totalFiles: filePaths.length
    }

    const collection = this.collection as {
      upsert: (params: { ids: string[]; documents: string[]; metadatas: Record<string, string>[] }) => Promise<void>
    }

    for (const filePath of filePaths) {
      try {
        // Only index .md files (skip .excalidraw for text search)
        if (!filePath.toLowerCase().endsWith('.md')) {
          this.indexingStatus.filesProcessed++
          continue
        }

        this.indexingStatus.currentFile = filePath
        const content = fs.readFileSync(filePath, 'utf-8')
        const chunks = this.splitIntoChunks(content, filePath)

        if (chunks.length > 0) {
          await collection.upsert({
            ids: chunks.map((c) => c.id),
            documents: chunks.map((c) => c.text),
            metadatas: chunks.map((c) => c.metadata)
          })
        }

        this.indexingStatus.filesProcessed++
      } catch (error) {
        console.error(`Failed to index file: ${filePath}`, error)
        this.indexingStatus.filesProcessed++
      }
    }

    this.indexingStatus = {
      isIndexing: false,
      filesProcessed: this.indexingStatus.totalFiles,
      totalFiles: this.indexingStatus.totalFiles
    }
  }

  /**
   * Performs a semantic search across indexed documents.
   * @param query - Natural language search query
   * @param limit - Maximum number of results (default: 5)
   * @returns Ranked search results with content snippets
   */
  async search(query: string, limit = 5): Promise<SearchResult[]> {
    if (!this.isReady || !this.collection) {
      return []
    }

    try {
      const collection = this.collection as {
        query: (params: { queryTexts: string[]; nResults: number }) => Promise<{
          ids: string[][]
          documents: (string | null)[][]
          metadatas: (Record<string, string> | null)[][]
          distances: number[][]
        }>
      }

      const results = await collection.query({
        queryTexts: [query],
        nResults: limit
      })

      if (!results.ids[0]) return []

      return results.ids[0].map((_, i) => ({
        path: results.metadatas[0]?.[i]?.path ?? '',
        filename: results.metadatas[0]?.[i]?.filename ?? '',
        content: results.documents[0]?.[i] ?? '',
        score: results.distances[0]?.[i] ?? 999,
        heading: results.metadatas[0]?.[i]?.heading
      }))
    } catch (error) {
      console.error('ChromaDB search failed:', error)
      return []
    }
  }

  /** Returns current indexing status */
  getStatus(): IndexingStatus {
    return { ...this.indexingStatus }
  }

  /** Whether the ChromaDB service is ready for operations */
  get ready(): boolean {
    return this.isReady
  }

  /**
   * Splits markdown content into chunks by headings.
   * Falls back to paragraph splitting if no headings found.
   */
  private splitIntoChunks(
    content: string,
    filePath: string
  ): { id: string; text: string; metadata: Record<string, string> }[] {
    const filename = path.basename(filePath)
    const chunks: { id: string; text: string; metadata: Record<string, string> }[] = []

    // Split by headings (## or ###)
    const sections = content.split(/(?=^#{1,3}\s)/m)

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim()
      if (!section) continue

      // Extract heading from first line
      const headingMatch = section.match(/^(#{1,3})\s+(.+)/)
      const heading = headingMatch ? headingMatch[2].trim() : `section-${i}`

      // If section is too long, split further by paragraphs
      if (section.length > 1000) {
        const paragraphs = section.split(/\n\n+/)
        for (let j = 0; j < paragraphs.length; j++) {
          const para = paragraphs[j].trim()
          if (para.length < 50) continue // Skip tiny fragments
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

    // Fallback: if no chunks were created, treat entire content as one chunk
    if (chunks.length === 0 && content.length >= 50) {
      chunks.push({
        id: `${filePath}::0`,
        text: content.substring(0, 1000),
        metadata: { path: filePath, filename, heading: 'full-document', chunk_index: '0' }
      })
    }

    return chunks
  }

  /**
   * Polls the ChromaDB server until it responds to heartbeat.
   * Times out after 30 seconds.
   */
  private async waitForReady(port: number, timeoutMs = 30000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        const response = await fetch(`http://localhost:${port}/api/v1/heartbeat`)
        if (response.ok) return
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    throw new Error(`ChromaDB server failed to start within ${timeoutMs}ms`)
  }
}
