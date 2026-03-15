import fs from 'fs'
import { getConfigPath } from '../utils/paths'
import type { AppConfig } from '../../shared/types'

/** Default configuration values */
const DEFAULT_CONFIG: AppConfig = {
  paths: [],
  editor: 'code',
  chromaPort: 6333,
  mcpPort: 6464
}

/**
 * Service for managing application configuration.
 * Config is persisted as JSON in the Electron userData directory.
 */
export class ConfigService {
  private config: AppConfig = { ...DEFAULT_CONFIG }

  /**
   * Loads configuration from disk. If the file doesn't exist,
   * creates it with default values.
   */
  async load(): Promise<AppConfig> {
    const configPath = getConfigPath()
    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8')
        const parsed = JSON.parse(raw) as Partial<AppConfig>
        this.config = { ...DEFAULT_CONFIG, ...parsed }
      } else {
        await this.save()
      }
    } catch (error) {
      console.error('Failed to load config, using defaults:', error)
      this.config = { ...DEFAULT_CONFIG }
    }
    return this.config
  }

  /** Returns the current in-memory configuration */
  get(): AppConfig {
    return { ...this.config }
  }

  /**
   * Updates configuration with partial values and saves to disk.
   * @param updates - Partial config object with fields to update
   */
  async update(updates: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...updates }
    await this.save()
  }

  /**
   * Adds a directory path to the list of document roots.
   * No-op if the path already exists.
   * @param dirPath - Absolute directory path to add
   */
  async addPath(dirPath: string): Promise<void> {
    if (!this.config.paths.includes(dirPath)) {
      this.config.paths.push(dirPath)
      await this.save()
    }
  }

  /**
   * Removes a directory path from the list of document roots.
   * @param dirPath - Absolute directory path to remove
   */
  async removePath(dirPath: string): Promise<void> {
    this.config.paths = this.config.paths.filter((p) => p !== dirPath)
    await this.save()
  }

  /** Persists current config to disk */
  private async save(): Promise<void> {
    const configPath = getConfigPath()
    const dir = configPath.substring(0, configPath.lastIndexOf('/') || configPath.lastIndexOf('\\'))
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2), 'utf-8')
  }
}
