# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-15

### Added
- Electron app with React 19 + Vite + TypeScript
- Navigable file tree aggregating multiple configured directory paths
- Markdown viewer with GFM support and syntax highlighting (react-markdown)
- Excalidraw diagram viewer in read-only mode (lazy-loaded)
- Configurable "Open in Editor" button (VS Code / Antigravity)
- Settings panel for managing document paths and editor preference
- JSON configuration persisted in Electron userData directory
- Git integration: Commit & Push button with status feedback
- ChromaDB integration for semantic document indexing
- Markdown chunking by headings for vector search
- Semantic search bar with debounced queries and content preview
- MCP HTTP server on port 6464 with `search_docs` tool
- Security: sandboxed preload, context isolation, path validation, CSP headers
- electron-builder configuration for Windows NSIS installer
- Dark theme UI (Catppuccin-inspired)
- Complete test suite (37 tests across 6 files)
- README, CLAUDE.md, and CHANGELOG documentation
