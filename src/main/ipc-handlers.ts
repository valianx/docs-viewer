import { ipcMain, dialog } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type { AppConfig } from '../shared/types'
import type { ConfigService } from './services/config.service'
import type { FileTreeService } from './services/file-tree.service'
import type { GitService } from './services/git.service'
import type { EditorService } from './services/editor.service'
import type { ChromaService } from './services/chroma.service'
import { isPathAllowed } from './utils/paths'

interface Services {
  config: ConfigService
  fileTree: FileTreeService
  git: GitService
  editor: EditorService
  chroma: ChromaService
}

/**
 * Registers all IPC handlers that bridge the renderer process
 * to the main process services.
 *
 * All handlers use ipcMain.handle for async request-response pattern.
 * File access is validated against configured paths to prevent traversal.
 */
export function registerIpcHandlers(services: Services): void {
  const { config, fileTree, git, editor, chroma } = services

  // File tree operations
  ipcMain.handle(IPC_CHANNELS.FILE_TREE_GET, async () => {
    const cfg = config.get()
    return fileTree.scan(cfg.paths)
  })

  ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, { path: filePath }: { path: string }) => {
    const cfg = config.get()
    if (!isPathAllowed(filePath, cfg.paths)) {
      throw new Error('Access denied: path is outside configured directories')
    }
    return fileTree.readFile(filePath)
  })

  // Config operations
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    return config.get()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE, async (_event, updates: Partial<AppConfig>) => {
    await config.update(updates)
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_ADD_PATH, async (_event, { path: dirPath }: { path: string }) => {
    await config.addPath(dirPath)
    // Index the newly added path
    const files = await fileTree.listAllFiles([dirPath])
    await chroma.indexFiles(files)
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_REMOVE_PATH, async (_event, { path: dirPath }: { path: string }) => {
    await config.removePath(dirPath)
  })

  // Dialog operations
  ipcMain.handle(IPC_CHANNELS.DIALOG_SELECT_DIR, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Editor operations
  ipcMain.handle(IPC_CHANNELS.EDITOR_OPEN, async (_event, { dirPath }: { dirPath: string }) => {
    const cfg = config.get()
    if (!isPathAllowed(dirPath, cfg.paths)) {
      throw new Error('Access denied: path is outside configured directories')
    }
    editor.open(dirPath, cfg.editor)
  })

  // Git operations
  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT_PUSH, async (_event, { repoPath }: { repoPath: string }) => {
    const cfg = config.get()
    if (!isPathAllowed(repoPath, cfg.paths)) {
      throw new Error('Access denied: path is outside configured directories')
    }
    const result = await git.commitAndPush(repoPath)

    // Re-index modified files after successful commit
    if (result.success && result.filesChanged && result.filesChanged.length > 0) {
      const files = await fileTree.listAllFiles([repoPath])
      await chroma.indexFiles(files)
    }

    return result
  })

  // Search operations
  ipcMain.handle(IPC_CHANNELS.SEARCH_QUERY, async (_event, { query }: { query: string }) => {
    return chroma.search(query)
  })

  // Indexing operations
  ipcMain.handle(IPC_CHANNELS.INDEX_PATH, async (_event, { path: dirPath }: { path: string }) => {
    const files = await fileTree.listAllFiles([dirPath])
    await chroma.indexFiles(files)
  })

  ipcMain.handle(IPC_CHANNELS.INDEX_STATUS, async () => {
    return chroma.getStatus()
  })
}
