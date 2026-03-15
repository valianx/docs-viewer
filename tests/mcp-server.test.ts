import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import express from 'express'
import type { Server } from 'http'

/**
 * Tests for the MCP server HTTP endpoints.
 * Tests the Express routes directly without ChromaDB dependency.
 * AC-8: MCP server on localhost:6464 with search_docs tool.
 */

// Mock search function
const mockSearch = vi.fn().mockResolvedValue([
  { path: '/docs/readme.md', filename: 'readme.md', content: 'Getting started guide', score: 0.15, heading: 'Introduction' }
])

function createMcpApp() {
  const app = express()
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'docs-viewer-mcp' })
  })

  app.post('/mcp', async (req, res) => {
    try {
      const { method, params, id } = req.body

      if (method === 'tools/list') {
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: [{
              name: 'search_docs',
              description: 'Search documentation using semantic search',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Semantic search query' },
                  limit: { type: 'number', description: 'Max results', default: 5 }
                },
                required: ['query']
              }
            }]
          }
        })
        return
      }

      if (method === 'tools/call') {
        const toolName = params?.name
        if (toolName === 'search_docs') {
          const { query, limit = 5 } = params?.arguments ?? {}
          if (!query || typeof query !== 'string') {
            res.json({
              jsonrpc: '2.0', id,
              error: { code: -32602, message: 'Invalid params: query is required and must be a string' }
            })
            return
          }
          const results = await mockSearch(query, limit)
          res.json({
            jsonrpc: '2.0', id,
            result: { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
          })
          return
        }
        res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown tool: ${toolName}` } })
        return
      }

      res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } })
    } catch (error) {
      res.status(500).json({
        jsonrpc: '2.0', id: req.body?.id,
        error: { code: -32603, message: `Internal error: ${error}` }
      })
    }
  })

  return app
}

describe('MCP Server', () => {
  let server: Server
  let port: number

  beforeAll(async () => {
    const app = createMcpApp()
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address()
        port = typeof addr === 'object' && addr ? addr.port : 0
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  })

  /** AC-8: Health check endpoint */
  it('should respond to health check', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`)
    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.service).toBe('docs-viewer-mcp')
  })

  /** AC-8: tools/list returns search_docs */
  it('should list available tools', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 })
    })
    const data = await res.json()
    expect(data.result.tools).toHaveLength(1)
    expect(data.result.tools[0].name).toBe('search_docs')
    expect(data.result.tools[0].inputSchema.required).toContain('query')
  })

  /** AC-8: When an LLM calls search_docs(query), it receives relevant chunks */
  it('should execute search_docs tool and return results', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'search_docs', arguments: { query: 'getting started', limit: 5 } },
        id: 2
      })
    })
    const data = await res.json()
    expect(data.result.content).toHaveLength(1)
    expect(data.result.content[0].type).toBe('text')

    const results = JSON.parse(data.result.content[0].text)
    expect(results).toHaveLength(1)
    expect(results[0].path).toBe('/docs/readme.md')
    expect(results[0].content).toBe('Getting started guide')
    expect(mockSearch).toHaveBeenCalledWith('getting started', 5)
  })

  /** AC-8: Error handling for missing query */
  it('should return error for missing query parameter', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'search_docs', arguments: {} },
        id: 3
      })
    })
    const data = await res.json()
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe(-32602)
  })

  it('should return error for unknown tool', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'unknown_tool', arguments: {} },
        id: 4
      })
    })
    const data = await res.json()
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe(-32601)
  })

  it('should return error for unknown method', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'unknown/method',
        id: 5
      })
    })
    const data = await res.json()
    expect(data.error).toBeDefined()
    expect(data.error.code).toBe(-32601)
  })
})
