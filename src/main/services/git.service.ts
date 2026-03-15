import { execFile } from 'child_process'
import { promisify } from 'util'
import type { GitResult } from '../../shared/types'

const execFileAsync = promisify(execFile)

/**
 * Service for executing git operations on document directories.
 * Uses execFile (not exec) to prevent shell injection.
 */
export class GitService {
  /**
   * Performs git add, commit, and push on a repository path.
   * @param repoPath - Absolute path to the git repository root
   * @returns GitResult with success status, message, and changed files
   */
  async commitAndPush(repoPath: string): Promise<GitResult> {
    try {
      // Check if this is a git repo
      await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: repoPath })

      // Get list of changed files before staging
      const { stdout: diffOutput } = await execFileAsync(
        'git',
        ['status', '--porcelain'],
        { cwd: repoPath }
      )

      if (!diffOutput.trim()) {
        return {
          success: true,
          message: 'No changes to commit',
          filesChanged: []
        }
      }

      const filesChanged = diffOutput
        .trim()
        .split('\n')
        .map((line) => line.substring(3).trim())

      // Stage all changes
      await execFileAsync('git', ['add', '.'], { cwd: repoPath })

      // Commit
      await execFileAsync(
        'git',
        ['commit', '-m', 'update docs'],
        { cwd: repoPath }
      )

      // Push
      try {
        await execFileAsync('git', ['push'], { cwd: repoPath })
      } catch (pushError) {
        return {
          success: true,
          message: `Committed ${filesChanged.length} file(s) but push failed. Check remote configuration.`,
          filesChanged
        }
      }

      return {
        success: true,
        message: `Committed and pushed ${filesChanged.length} file(s)`,
        filesChanged
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        message: `Git operation failed: ${errorMessage}`
      }
    }
  }

  /**
   * Gets the list of files changed since last commit.
   * Used for selective re-indexing after git operations.
   * @param repoPath - Absolute path to the git repository root
   * @returns Array of changed file paths (relative to repo root)
   */
  async getChangedFiles(repoPath: string): Promise<string[]> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['diff', '--name-only', 'HEAD~1', 'HEAD'],
        { cwd: repoPath }
      )
      return stdout.trim().split('\n').filter(Boolean)
    } catch {
      return []
    }
  }
}
