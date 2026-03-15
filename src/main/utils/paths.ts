import { app } from 'electron'
import path from 'path'

/**
 * Returns the path to the application's user data directory.
 * On Windows: %APPDATA%/docs-viewer
 */
export function getUserDataPath(): string {
  return app.getPath('userData')
}

/**
 * Returns the path to the config file stored in user data.
 */
export function getConfigPath(): string {
  return path.join(getUserDataPath(), 'config.json')
}

/**
 * Returns the path where ChromaDB should store its data.
 */
export function getChromaDataPath(): string {
  return path.join(getUserDataPath(), 'chroma')
}

/**
 * Normalizes a file path to use forward slashes consistently.
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

/**
 * Checks if a given path is a child of one of the allowed root paths.
 * Prevents path traversal attacks.
 */
export function isPathAllowed(filePath: string, allowedRoots: string[]): boolean {
  const normalized = path.resolve(filePath)
  return allowedRoots.some((root) => {
    const normalizedRoot = path.resolve(root)
    return normalized.startsWith(normalizedRoot)
  })
}
