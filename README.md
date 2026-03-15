# Docs Viewer

Centralized markdown and Excalidraw viewer with semantic search and MCP integration for LLMs.

## Features

- **Unified File Tree** — Aggregate multiple directory paths into a single navigable tree
- **Markdown Viewer** — Render `.md` files with GFM support and syntax highlighting
- **Excalidraw Viewer** — Display `.excalidraw` diagrams in read-only mode
- **Open in Editor** — Launch VS Code or Antigravity directly from the viewer
- **Semantic Search** — Find documents by meaning using ChromaDB embeddings
- **Git Integration** — Commit & Push changes with one click
- **MCP Server** — Expose `search_docs` tool on port 6464 for LLM integration
- **Windows Installer** — Package as `.exe` with electron-builder

## Tech Stack

- **Desktop:** Electron 33
- **Frontend:** React 19 + TypeScript + Vite
- **Build:** electron-vite
- **Search:** ChromaDB (managed local server) + Transformers.js embeddings
- **MCP:** JSON-RPC HTTP server on port 6464
- **Package Manager:** pnpm

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- [ChromaDB](https://www.trychroma.com/) CLI (`pip install chromadb`) — required for semantic search

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development mode (with HMR)
pnpm dev

# Build for production
pnpm build

# Package as Windows installer
pnpm dist
```

## Configuration

Settings are stored in `%APPDATA%/docs-viewer/config.json`:

| Setting | Default | Description |
|---------|---------|-------------|
| `paths` | `[]` | Document root directories |
| `editor` | `"code"` | Editor command (`code` or `antigravity`) |
| `chromaPort` | `6333` | Internal ChromaDB server port |
| `mcpPort` | `6464` | MCP server port |

## MCP Integration

The app exposes an MCP-compatible HTTP server for LLM tool use:

```json
{
  "method": "tools/call",
  "params": {
    "name": "search_docs",
    "arguments": {
      "query": "how to configure authentication",
      "limit": 5
    }
  }
}
```

**Endpoint:** `POST http://127.0.0.1:6464/mcp`

Returns ranked document chunks with file paths and content snippets.

## Project Structure

```
src/
  main/                    # Electron main process
    services/              # Business logic services
      config.service.ts    # JSON config management
      file-tree.service.ts # File system scanning
      git.service.ts       # Git commit & push
      editor.service.ts    # External editor launch
      chroma.service.ts    # ChromaDB lifecycle + indexing
      mcp-server.service.ts # MCP HTTP server
    ipc-handlers.ts        # IPC bridge registration
    index.ts               # App entry point
  preload/                 # Sandboxed preload script
    index.ts               # contextBridge API exposure
  renderer/                # React frontend
    src/
      components/          # UI components
      hooks/               # React hooks
      styles/              # Global CSS
  shared/
    types.ts               # Shared TypeScript types
```

## Security

- Renderer is sandboxed with `contextIsolation: true` and `nodeIntegration: false`
- All main process access goes through typed IPC channels via `contextBridge`
- File access is validated against configured root paths (no path traversal)
- Git commands use `execFile` (not `exec`) to prevent shell injection
- ChromaDB and MCP servers bind to `127.0.0.1` only (no remote access)
- Content rendered via `react-markdown` (sanitized by default)

## License

MIT
