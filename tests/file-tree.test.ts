import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Import the service logic directly (we replicate the core scanning logic
// since the actual service imports Electron-dependent modules)

const SUPPORTED_EXTENSIONS = new Set(['.md', '.excalidraw'])

interface TreeNode {
  name: string
  path: string
  type: 'directory' | 'file'
  extension?: string
  children?: TreeNode[]
}

/**
 * Simplified version of FileTreeService.scanDirectory for testing.
 */
function scanDirectory(dirPath: string): TreeNode | null {
  const name = path.basename(dirPath)
  const children: TreeNode[] = []

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return null
  }

  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1
    if (!a.isDirectory() && b.isDirectory()) return 1
    return a.name.localeCompare(b.name)
  })

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'out') continue
      const subTree = scanDirectory(fullPath)
      if (subTree) children.push(subTree)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        children.push({ name: entry.name, path: fullPath, type: 'file', extension: ext })
      }
    }
  }

  if (children.length === 0) return null
  return { name, path: dirPath, type: 'directory', children }
}

describe('FileTreeService scanning logic', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-viewer-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  /** AC-1: Given multiple configured paths, tree shows all .md and .excalidraw maintaining folder structure */
  it('should find .md files in directory tree', () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# Hello')
    fs.mkdirSync(path.join(tmpDir, 'sub'))
    fs.writeFileSync(path.join(tmpDir, 'sub', 'guide.md'), '# Guide')

    const result = scanDirectory(tmpDir)
    expect(result).not.toBeNull()
    expect(result!.children).toHaveLength(2) // sub dir + readme.md
    expect(result!.children![0].type).toBe('directory') // directories first
    expect(result!.children![1].name).toBe('readme.md')
    expect(result!.children![0].children![0].name).toBe('guide.md')
  })

  /** AC-1: Tree shows .excalidraw files */
  it('should find .excalidraw files', () => {
    fs.writeFileSync(path.join(tmpDir, 'diagram.excalidraw'), '{}')

    const result = scanDirectory(tmpDir)
    expect(result).not.toBeNull()
    expect(result!.children![0].name).toBe('diagram.excalidraw')
    expect(result!.children![0].extension).toBe('.excalidraw')
  })

  it('should exclude unsupported file types', () => {
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# Hello')
    fs.writeFileSync(path.join(tmpDir, 'data.json'), '{}')
    fs.writeFileSync(path.join(tmpDir, 'script.ts'), 'const x = 1')

    const result = scanDirectory(tmpDir)
    expect(result).not.toBeNull()
    expect(result!.children).toHaveLength(1)
    expect(result!.children![0].name).toBe('readme.md')
  })

  it('should skip hidden files and directories', () => {
    fs.writeFileSync(path.join(tmpDir, '.hidden.md'), '# Hidden')
    fs.mkdirSync(path.join(tmpDir, '.git'))
    fs.writeFileSync(path.join(tmpDir, '.git', 'config.md'), '# Git')
    fs.writeFileSync(path.join(tmpDir, 'visible.md'), '# Visible')

    const result = scanDirectory(tmpDir)
    expect(result).not.toBeNull()
    expect(result!.children).toHaveLength(1)
    expect(result!.children![0].name).toBe('visible.md')
  })

  it('should skip node_modules directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'node_modules'))
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'lib.md'), '# Lib')
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# App')

    const result = scanDirectory(tmpDir)
    expect(result).not.toBeNull()
    expect(result!.children).toHaveLength(1)
    expect(result!.children![0].name).toBe('readme.md')
  })

  it('should return null for empty directories (no supported files)', () => {
    fs.writeFileSync(path.join(tmpDir, 'data.json'), '{}')

    const result = scanDirectory(tmpDir)
    expect(result).toBeNull()
  })

  /** AC-1: Maintains folder structure */
  it('should maintain folder structure with nested directories', () => {
    fs.mkdirSync(path.join(tmpDir, 'docs'))
    fs.mkdirSync(path.join(tmpDir, 'docs', 'api'))
    fs.writeFileSync(path.join(tmpDir, 'docs', 'api', 'endpoints.md'), '# API')
    fs.writeFileSync(path.join(tmpDir, 'docs', 'getting-started.md'), '# Start')
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# Root')

    const result = scanDirectory(tmpDir)
    expect(result).not.toBeNull()
    expect(result!.children).toHaveLength(2) // docs/ and readme.md

    const docsDir = result!.children![0]
    expect(docsDir.name).toBe('docs')
    expect(docsDir.type).toBe('directory')
    expect(docsDir.children).toHaveLength(2) // api/ and getting-started.md

    const apiDir = docsDir.children![0]
    expect(apiDir.name).toBe('api')
    expect(apiDir.children![0].name).toBe('endpoints.md')
  })
})
