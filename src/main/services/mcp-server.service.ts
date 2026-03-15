import express from 'express'
import type { Server } from 'http'
import type { ChromaService } from './chroma.service'

/**
 * MCP Server service that exposes a search_docs tool via HTTP.
 *
 * Runs an Express HTTP server on the configured port (default: 6464).
 * Implements a simplified MCP-compatible endpoint that LLMs can use
 * to search documentation via semantic search.
 *
 * The server uses a simplified JSON-RPC style protocol compatible
 * with MCP tool invocations.
 */
export class McpServerService {
  private app: express.Application
  private server: Server | null = null
  private chromaService: ChromaService

  constructor(chromaService: ChromaService) {
    this.chromaService = chromaService
    this.app = express()
    this.app.use(express.json())
    this.setupRoutes()
  }

  /**
   * Starts the MCP HTTP server on the given port.
   * @param port - Port to listen on (default: 6464)
   */
  async start(port = 6464): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, '127.0.0.1', () => {
          console.log(`MCP server listening on http://127.0.0.1:${port}`)
          resolve()
        })
        this.server.on('error', (err) => {
          console.error('MCP server error:', err)
          reject(err)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Stops the MCP HTTP server.
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * Configures Express routes for the MCP server.
   * Implements JSON-RPC style endpoints compatible with MCP clients.
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'docs-viewer-mcp' })
    })

    // MCP-compatible endpoint
    this.app.post('/mcp', async (req, res) => {
      try {
        const { method, params, id } = req.body

        if (method === 'tools/list') {
          res.json({
            jsonrpc: '2.0',
            id,
            result: {
              tools: [
                {
                  name: 'search_docs',
                  description: 'Search documentation using semantic search. Returns the most relevant document chunks with file paths and content.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Semantic search query'
                      },
                      limit: {
                        type: 'number',
                        description: 'Maximum number of results (default: 5)',
                        default: 5
                      }
                    },
                    required: ['query']
                  }
                }
              ]
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
                jsonrpc: '2.0',
                id,
                error: { code: -32602, message: 'Invalid params: query is required and must be a string' }
              })
              return
            }

            const results = await this.chromaService.search(query, limit)
            res.json({
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(results, null, 2)
                  }
                ]
              }
            })
            return
          }

          res.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Unknown tool: ${toolName}` }
          })
          return
        }

        // Default: method not found
        res.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          error: { code: -32603, message: `Internal error: ${message}` }
        })
      }
    })
  }
}
