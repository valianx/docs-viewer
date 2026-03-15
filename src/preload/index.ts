import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type { AppConfig, TreeNode, GitResult, SearchResult, IndexingStatus } from '../shared/types'

/**
 * Preload script that exposes a typed API to the renderer process
 * via contextBridge. This is the ONLY bridge between renderer and main.
 *
 * All methods use ipcRenderer.invoke for async request-response.
 * The renderer accesses this as window.api.
 */
const api = {
  /** Fetches the file tree from all configured paths */
  getFileTree: (): Promise<TreeNode[]> => ipcRenderer.invoke(IPC_CHANNELS.FILE_TREE_GET),

  /** Reads the content of a file by its absolute path */
  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_READ, { path: filePath }),

  /** Gets the current application configuration */
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),

  /** Updates application configuration with partial values */
  updateConfig: (config: Partial<AppConfig>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE, config),

  /** Adds a new directory path to the document roots */
  addPath: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_ADD_PATH, { path: dirPath }),

  /** Removes a directory path from the document roots */
  removePath: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_REMOVE_PATH, { path: dirPath }),

  /** Opens a native directory selection dialog */
  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SELECT_DIR),

  /** Opens the configured editor at the given directory */
  openInEditor: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.EDITOR_OPEN, { dirPath }),

  /** Performs git add, commit, and push on a repository */
  commitAndPush: (repoPath: string): Promise<GitResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT_PUSH, { repoPath }),

  /** Performs semantic search across indexed documents */
  searchDocs: (query: string): Promise<SearchResult[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.SEARCH_QUERY, { query }),

  /** Triggers indexing of a specific directory path */
  indexPath: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_PATH, { path: dirPath }),

  /** Gets the current indexing status */
  getIndexingStatus: (): Promise<IndexingStatus> =>
    ipcRenderer.invoke(IPC_CHANNELS.INDEX_STATUS)
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
