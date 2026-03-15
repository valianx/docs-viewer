import { spawn } from 'child_process'
import type { AppConfig } from '../../shared/types'

/**
 * Service for launching external editors.
 * Spawns the configured editor as a detached process.
 */
export class EditorService {
  /**
   * Opens the configured editor at the given directory path.
   * The process is spawned detached so it doesn't block the app.
   * @param dirPath - Absolute path to the directory to open
   * @param editor - Editor command to use ('code' or 'antigravity')
   */
  open(dirPath: string, editor: AppConfig['editor']): void {
    const command = editor === 'antigravity' ? 'antigravity' : 'code'

    const child = spawn(command, [dirPath], {
      detached: true,
      stdio: 'ignore',
      shell: process.platform === 'win32'
    })

    // Allow the parent process to exit independently
    child.unref()
  }
}
