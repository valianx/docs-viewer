import fs from 'fs'
import path from 'path'
import type { TreeNode } from '../../shared/types'

/** Supported file extensions for the viewer */
const SUPPORTED_EXTENSIONS = new Set(['.md', '.excalidraw'])

/**
 * Service for scanning the file system and building a tree structure
 * of supported documents (.md and .excalidraw files).
 */
export class FileTreeService {
  /**
   * Scans multiple directory paths and returns a combined file tree.
   * Each root path becomes a top-level directory node.
   * @param paths - Array of absolute directory paths to scan
   * @returns Array of tree nodes representing the combined file tree
   */
  async scan(paths: string[]): Promise<TreeNode[]> {
    const trees: TreeNode[] = []
    for (const dirPath of paths) {
      try {
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          const node = this.scanDirectory(dirPath)
          if (node) {
            trees.push(node)
          }
        }
      } catch (error) {
        console.error(`Failed to scan path: ${dirPath}`, error)
      }
    }
    return trees
  }

  /**
   * Recursively scans a single directory and builds a tree node.
   * Only includes directories that contain supported files (directly or nested).
   * @param dirPath - Absolute path to the directory to scan
   * @returns TreeNode for the directory, or null if it contains no supported files
   */
  private scanDirectory(dirPath: string): TreeNode | null {
    const name = path.basename(dirPath)
    const children: TreeNode[] = []

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true })
    } catch {
      return null
    }

    // Sort entries: directories first, then files, both alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name.startsWith('.')) continue

      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Skip node_modules and similar
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'out') {
          continue
        }
        const subTree = this.scanDirectory(fullPath)
        if (subTree) {
          children.push(subTree)
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          children.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            extension: ext
          })
        }
      }
    }

    // Only include directories that have supported content
    if (children.length === 0) return null

    return {
      name,
      path: dirPath,
      type: 'directory',
      children
    }
  }

  /**
   * Reads the content of a file.
   * @param filePath - Absolute path to the file
   * @returns File content as a string
   */
  async readFile(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8')
  }

  /**
   * Returns a flat list of all supported file paths under the given directories.
   * Used for indexing operations.
   * @param paths - Array of root directory paths
   * @returns Array of absolute file paths
   */
  async listAllFiles(paths: string[]): Promise<string[]> {
    const files: string[] = []
    for (const dirPath of paths) {
      this.collectFiles(dirPath, files)
    }
    return files
  }

  /**
   * Recursively collects supported files from a directory.
   */
  private collectFiles(dirPath: string, result: string[]): void {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'out') {
            this.collectFiles(fullPath, result)
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            result.push(fullPath)
          }
        }
      }
    } catch {
      // Silently skip inaccessible directories
    }
  }
}
