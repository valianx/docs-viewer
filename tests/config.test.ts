import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Test config service logic without Electron dependency
// We replicate the core logic since ConfigService uses app.getPath('userData')

interface AppConfig {
  paths: string[]
  editor: 'code' | 'antigravity'
  chromaPort: number
  mcpPort: number
}

const DEFAULT_CONFIG: AppConfig = {
  paths: [],
  editor: 'code',
  chromaPort: 6333,
  mcpPort: 6464
}

/**
 * Simplified ConfigService that operates on a given file path.
 */
class TestConfigService {
  private config: AppConfig = { ...DEFAULT_CONFIG }
  constructor(private configPath: string) {}

  async load(): Promise<AppConfig> {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8')
        const parsed = JSON.parse(raw) as Partial<AppConfig>
        this.config = { ...DEFAULT_CONFIG, ...parsed }
      } else {
        await this.save()
      }
    } catch {
      this.config = { ...DEFAULT_CONFIG }
    }
    return this.config
  }

  get(): AppConfig { return { ...this.config } }

  async update(updates: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...updates }
    await this.save()
  }

  async addPath(dirPath: string): Promise<void> {
    if (!this.config.paths.includes(dirPath)) {
      this.config.paths.push(dirPath)
      await this.save()
    }
  }

  async removePath(dirPath: string): Promise<void> {
    this.config.paths = this.config.paths.filter((p) => p !== dirPath)
    await this.save()
  }

  private async save(): Promise<void> {
    const dir = path.dirname(this.configPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
  }
}

describe('ConfigService', () => {
  let tmpDir: string
  let configPath: string
  let service: TestConfigService

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-viewer-config-'))
    configPath = path.join(tmpDir, 'config.json')
    service = new TestConfigService(configPath)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  /** AC-5: Config management for paths */
  it('should create config with defaults when file does not exist', async () => {
    const config = await service.load()
    expect(config.paths).toEqual([])
    expect(config.editor).toBe('code')
    expect(config.chromaPort).toBe(6333)
    expect(config.mcpPort).toBe(6464)
    expect(fs.existsSync(configPath)).toBe(true)
  })

  it('should load existing config from disk', async () => {
    const existing: AppConfig = {
      paths: ['/docs/project1'],
      editor: 'antigravity',
      chromaPort: 6333,
      mcpPort: 6464
    }
    fs.writeFileSync(configPath, JSON.stringify(existing))

    const config = await service.load()
    expect(config.paths).toEqual(['/docs/project1'])
    expect(config.editor).toBe('antigravity')
  })

  /** AC-5: When I add a new path, config updates */
  it('should add a path and persist', async () => {
    await service.load()
    await service.addPath('/docs/new-project')

    const config = service.get()
    expect(config.paths).toContain('/docs/new-project')

    // Verify persistence
    const persisted = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(persisted.paths).toContain('/docs/new-project')
  })

  it('should not add duplicate paths', async () => {
    await service.load()
    await service.addPath('/docs/project1')
    await service.addPath('/docs/project1')

    const config = service.get()
    expect(config.paths.filter((p: string) => p === '/docs/project1')).toHaveLength(1)
  })

  it('should remove a path and persist', async () => {
    await service.load()
    await service.addPath('/docs/project1')
    await service.addPath('/docs/project2')
    await service.removePath('/docs/project1')

    const config = service.get()
    expect(config.paths).not.toContain('/docs/project1')
    expect(config.paths).toContain('/docs/project2')
  })

  it('should update editor preference', async () => {
    await service.load()
    await service.update({ editor: 'antigravity' })

    const config = service.get()
    expect(config.editor).toBe('antigravity')
  })

  it('should merge partial updates without losing other fields', async () => {
    await service.load()
    await service.addPath('/docs/merge-test')
    await service.update({ editor: 'antigravity' })

    const config = service.get()
    expect(config.paths).toContain('/docs/merge-test')
    expect(config.editor).toBe('antigravity')
    // Verify update didn't wipe paths
    expect(config.paths.length).toBeGreaterThanOrEqual(1)
  })
})
