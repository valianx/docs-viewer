/** Tree node representing a file or directory in the file tree */
export interface TreeNode {
  /** Display name of the file or directory */
  name: string
  /** Absolute file system path */
  path: string
  /** Whether this node is a directory or a file */
  type: 'directory' | 'file'
  /** File extension (only for files) */
  extension?: string
  /** Child nodes (only for directories) */
  children?: TreeNode[]
}

/** Application configuration persisted in userData/config.json */
export interface AppConfig {
  /** List of root directory paths to scan for documents */
  paths: string[]
  /** Preferred editor command */
  editor: 'code' | 'antigravity'
  /** Internal ChromaDB server port */
  chromaPort: number
  /** MCP server port */
  mcpPort: number
}

/** Result of a git commit & push operation */
export interface GitResult {
  /** Whether the operation succeeded */
  success: boolean
  /** Human-readable message describing what happened */
  message: string
  /** Files that were committed (if any) */
  filesChanged?: string[]
}

/** Single search result from semantic search */
export interface SearchResult {
  /** Absolute path to the source file */
  path: string
  /** File name */
  filename: string
  /** Content snippet that matched the query */
  content: string
  /** Relevance score (lower is more relevant for ChromaDB distances) */
  score: number
  /** Which heading or section this chunk belongs to */
  heading?: string
}

/** Status of an ongoing indexing operation */
export interface IndexingStatus {
  /** Whether indexing is currently running */
  isIndexing: boolean
  /** Number of files processed so far */
  filesProcessed: number
  /** Total number of files to process */
  totalFiles: number
  /** Current file being processed */
  currentFile?: string
}

/** IPC channel names used for communication between main and renderer */
export const IPC_CHANNELS = {
  FILE_TREE_GET: 'file-tree:get',
  FILE_READ: 'file:read',
  CONFIG_GET: 'config:get',
  CONFIG_UPDATE: 'config:update',
  CONFIG_ADD_PATH: 'config:add-path',
  CONFIG_REMOVE_PATH: 'config:remove-path',
  DIALOG_SELECT_DIR: 'dialog:select-dir',
  EDITOR_OPEN: 'editor:open',
  GIT_COMMIT_PUSH: 'git:commit-push',
  SEARCH_QUERY: 'search:query',
  INDEX_PATH: 'index:path',
  INDEX_STATUS: 'index:status'
} as const
