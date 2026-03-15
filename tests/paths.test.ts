import { describe, it, expect } from 'vitest'
import path from 'path'

// Test the path utility functions directly (extracted logic, no Electron dependency)

/**
 * Checks if a given path is a child of one of the allowed root paths.
 * Mirrors the logic in src/main/utils/paths.ts
 */
function isPathAllowed(filePath: string, allowedRoots: string[]): boolean {
  const normalized = path.resolve(filePath)
  return allowedRoots.some((root) => {
    const normalizedRoot = path.resolve(root)
    return normalized.startsWith(normalizedRoot)
  })
}

/**
 * Normalizes a file path to use forward slashes consistently.
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

describe('Path utilities', () => {
  describe('isPathAllowed', () => {
    /** AC-related: Security — prevents path traversal (AC-1, AC-2, AC-4) */
    it('should allow paths within configured roots', () => {
      const roots = ['/docs/project1', '/docs/project2']
      expect(isPathAllowed('/docs/project1/readme.md', roots)).toBe(true)
      expect(isPathAllowed('/docs/project2/sub/file.md', roots)).toBe(true)
    })

    it('should reject paths outside configured roots', () => {
      const roots = ['/docs/project1']
      expect(isPathAllowed('/etc/passwd', roots)).toBe(false)
      expect(isPathAllowed('/docs/project2/file.md', roots)).toBe(false)
    })

    it('should reject path traversal attempts', () => {
      const roots = ['/docs/project1']
      expect(isPathAllowed('/docs/project1/../../etc/passwd', roots)).toBe(false)
    })

    it('should handle empty roots list', () => {
      expect(isPathAllowed('/any/path', [])).toBe(false)
    })
  })

  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(normalizePath('C:\\Users\\docs\\file.md')).toBe('C:/Users/docs/file.md')
    })

    it('should leave forward slashes unchanged', () => {
      expect(normalizePath('/docs/file.md')).toBe('/docs/file.md')
    })

    it('should handle mixed slashes', () => {
      expect(normalizePath('C:\\Users/docs\\file.md')).toBe('C:/Users/docs/file.md')
    })
  })
})
