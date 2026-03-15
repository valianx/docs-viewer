import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { ConfigService } from './services/config.service'
import { FileTreeService } from './services/file-tree.service'
import { GitService } from './services/git.service'
import { EditorService } from './services/editor.service'
import { ChromaService } from './services/chroma.service'
import { McpServerService } from './services/mcp-server.service'
import { registerIpcHandlers } from './ipc-handlers'

// Service instances
const configService = new ConfigService()
const fileTreeService = new FileTreeService()
const gitService = new GitService()
const editorService = new EditorService()
const chromaService = new ChromaService()
let mcpServerService: McpServerService

/**
 * Creates the main application window.
 */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'Docs Viewer',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Application initialization sequence:
 * 1. Load config
 * 2. Start ChromaDB server (async, non-blocking)
 * 3. Start MCP server
 * 4. Register IPC handlers
 * 5. Create window
 */
app.whenReady().then(async () => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.docsviewer.app')

  // Default open or close DevTools by F12 in dev, ignore in prod
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Load configuration
  await configService.load()

  // Register IPC handlers
  registerIpcHandlers({
    config: configService,
    fileTree: fileTreeService,
    git: gitService,
    editor: editorService,
    chroma: chromaService
  })

  // Start ChromaDB in background (don't block window creation)
  const config = configService.get()
  chromaService.start(config.chromaPort).then(async () => {
    // Index existing paths on startup
    if (config.paths.length > 0) {
      const files = await fileTreeService.listAllFiles(config.paths)
      await chromaService.indexFiles(files)
    }
  }).catch((err) => {
    console.error('ChromaDB startup failed:', err)
    console.warn('App will work without semantic search')
  })

  // Start MCP server
  mcpServerService = new McpServerService(chromaService)
  mcpServerService.start(config.mcpPort).catch((err) => {
    console.error('MCP server startup failed:', err)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Cleanup on app quit
app.on('before-quit', async () => {
  await mcpServerService?.stop()
  await chromaService.stop()
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
