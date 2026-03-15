import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../src/shared/types'

/**
 * Tests for shared types and constants.
 * Ensures IPC channel names are consistent and all defined.
 */
describe('IPC Channels', () => {
  it('should define all expected IPC channels', () => {
    expect(IPC_CHANNELS.FILE_TREE_GET).toBe('file-tree:get')
    expect(IPC_CHANNELS.FILE_READ).toBe('file:read')
    expect(IPC_CHANNELS.CONFIG_GET).toBe('config:get')
    expect(IPC_CHANNELS.CONFIG_UPDATE).toBe('config:update')
    expect(IPC_CHANNELS.CONFIG_ADD_PATH).toBe('config:add-path')
    expect(IPC_CHANNELS.CONFIG_REMOVE_PATH).toBe('config:remove-path')
    expect(IPC_CHANNELS.DIALOG_SELECT_DIR).toBe('dialog:select-dir')
    expect(IPC_CHANNELS.EDITOR_OPEN).toBe('editor:open')
    expect(IPC_CHANNELS.GIT_COMMIT_PUSH).toBe('git:commit-push')
    expect(IPC_CHANNELS.SEARCH_QUERY).toBe('search:query')
    expect(IPC_CHANNELS.INDEX_PATH).toBe('index:path')
    expect(IPC_CHANNELS.INDEX_STATUS).toBe('index:status')
  })

  it('should have 12 IPC channels defined', () => {
    const channelCount = Object.keys(IPC_CHANNELS).length
    expect(channelCount).toBe(12)
  })

  it('should have unique channel values', () => {
    const values = Object.values(IPC_CHANNELS)
    expect(new Set(values).size).toBe(values.length)
  })
})
