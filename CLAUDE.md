# CLAUDE.md — docs-viewer

## Project Overview
Centralized markdown and Excalidraw viewer built with Electron + React + Vite + TypeScript.
Features semantic search via embedded ChromaDB and MCP server for LLM integration.

## Tech Stack
- **Runtime:** Electron (main + renderer processes)
- **Frontend:** React + Vite + TypeScript
- **Search:** ChromaDB embedded (local storage in AppData)
- **MCP:** HTTP server on port 6464 with `search_docs` tool
- **Build:** electron-builder for Windows .exe installer
- **Package Manager:** pnpm (ALWAYS use pnpm, never npm or yarn)

## Project Structure
```
src/
  main/           # Electron main process
  renderer/       # React frontend (Vite)
  shared/         # Shared types and utilities
  mcp/            # MCP server
```

## Commands
- `pnpm install` — install dependencies
- `pnpm dev` — start development mode
- `pnpm build` — build for production
- `pnpm test` — run tests
- `pnpm lint` — run linter

## Conventions
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Atomic git commits per feature
- TSDoc on all public functions
- Comments on non-trivial logic
- All file paths use forward slashes in code
- Config stored in Electron userData directory (JSON)

## Architecture Decisions
- ChromaDB runs embedded (no external server) — data stored in AppData/docs-viewer/chroma/
- MCP server runs as a separate HTTP server within the Electron main process
- File tree supports multiple root paths configured by the user
- Git operations execute via child_process in main process
- Editor launch uses configurable command (default: `code .`)
