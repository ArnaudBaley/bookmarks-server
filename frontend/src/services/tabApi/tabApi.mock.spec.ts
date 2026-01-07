import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockTabApi } from './tabApi.mock'
import { createTabDto } from '@/test-utils'

describe('MockTabApi', () => {
  let api: MockTabApi

  beforeEach(() => {
    api = new MockTabApi()
    api.clearStorage()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('getAllTabs', () => {
    it('returns empty array when no tabs exist', async () => {
      const result = await api.getAllTabs()
      expect(result).toEqual([])
    })

    it('returns stored tabs', async () => {
      await api.createTab(createTabDto({ name: 'Tab 1' }))
      await api.createTab(createTabDto({ name: 'Tab 2' }))

      const result = await api.getAllTabs()

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(expect.objectContaining({ name: 'Tab 1' }))
      expect(result).toContainEqual(expect.objectContaining({ name: 'Tab 2' }))
    })

    it('simulates network delay', async () => {
      const startTime = Date.now()
      await api.getAllTabs()
      const endTime = Date.now()

      // Should take at least 200ms (delay is 300ms by default)
      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })

    it('persists data in localStorage', async () => {
      await api.createTab(createTabDto({ name: 'Persisted Tab' }))

      // Create new instance to verify persistence
      const newApi = new MockTabApi()
      const result = await newApi.getAllTabs()

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Persisted Tab')
    })
  })

  describe('getTabById', () => {
    it('returns tab when found', async () => {
      const createdTab = await api.createTab(createTabDto({ name: 'Test Tab' }))
      const result = await api.getTabById(createdTab.id)

      expect(result).toEqual(createdTab)
    })

    it('throws error when tab not found', async () => {
      await expect(api.getTabById('non-existent-id')).rejects.toThrow(
        'Tab with id non-existent-id not found'
      )
    })

    it('simulates network delay', async () => {
      const createdTab = await api.createTab(createTabDto())
      const startTime = Date.now()
      await api.getTabById(createdTab.id)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })
  })

  describe('createTab', () => {
    it('creates tab with generated ID', async () => {
      const tabDto = createTabDto({ name: 'New Tab', color: '#ef4444' })
      const result = await api.createTab(tabDto)

      expect(result.id).toBeDefined()
      expect(result.name).toBe('New Tab')
      expect(result.color).toBe('#ef4444')
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })

    it('adds createdAt and updatedAt timestamps', async () => {
      const tabDto = createTabDto()
      const result = await api.createTab(tabDto)

      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(new Date(result.createdAt!).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('stores tab in localStorage', async () => {
      const tabDto = createTabDto({ name: 'Stored Tab' })
      const createdTab = await api.createTab(tabDto)

      const allTabs = await api.getAllTabs()
      expect(allTabs).toContainEqual(createdTab)
    })

    it('generates unique IDs for multiple tabs', async () => {
      const tab1 = await api.createTab(createTabDto({ name: 'Tab 1' }))
      const tab2 = await api.createTab(createTabDto({ name: 'Tab 2' }))

      expect(tab1.id).not.toBe(tab2.id)
    })

    it('handles null color', async () => {
      const tabDto = { name: 'Tab without color' }
      const result = await api.createTab(tabDto)

      expect(result.color).toBeNull()
    })

    it('simulates network delay', async () => {
      const startTime = Date.now()
      await api.createTab(createTabDto())
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })
  })

  describe('updateTab', () => {
    it('updates tab successfully', async () => {
      const createdTab = await api.createTab(createTabDto({ name: 'Original Name' }))
      const result = await api.updateTab(createdTab.id, { name: 'Updated Name' })

      expect(result.name).toBe('Updated Name')
      expect(result.id).toBe(createdTab.id)
      expect(result.createdAt).toBe(createdTab.createdAt)
      expect(result.updatedAt).not.toBe(createdTab.updatedAt)
    })

    it('updates color', async () => {
      const createdTab = await api.createTab(createTabDto({ name: 'Tab', color: '#3b82f6' }))
      const result = await api.updateTab(createdTab.id, { color: '#ef4444' })

      expect(result.color).toBe('#ef4444')
    })

    it('can set color to null', async () => {
      const createdTab = await api.createTab(createTabDto({ name: 'Tab', color: '#3b82f6' }))
      const result = await api.updateTab(createdTab.id, { color: null })

      expect(result.color).toBeNull()
    })

    it('preserves existing values when partial update', async () => {
      const createdTab = await api.createTab(createTabDto({ name: 'Original', color: '#3b82f6' }))
      const result = await api.updateTab(createdTab.id, { name: 'Updated' })

      expect(result.name).toBe('Updated')
      expect(result.color).toBe('#3b82f6')
    })

    it('throws error if tab not found', async () => {
      await expect(api.updateTab('non-existent-id', { name: 'Updated' })).rejects.toThrow(
        'Tab with id non-existent-id not found'
      )
    })

    it('persists update in localStorage', async () => {
      const createdTab = await api.createTab(createTabDto({ name: 'Original' }))
      await api.updateTab(createdTab.id, { name: 'Updated' })

      const allTabs = await api.getAllTabs()
      const updatedTab = allTabs.find((tab) => tab.id === createdTab.id)
      expect(updatedTab?.name).toBe('Updated')
    })

    it('simulates network delay', async () => {
      const createdTab = await api.createTab(createTabDto())
      const startTime = Date.now()
      await api.updateTab(createdTab.id, { name: 'Updated' })
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })
  })

  describe('deleteTab', () => {
    it('removes tab by ID', async () => {
      const tab1 = await api.createTab(createTabDto({ name: 'Tab 1' }))
      const tab2 = await api.createTab(createTabDto({ name: 'Tab 2' }))

      await api.deleteTab(tab1.id)

      const allTabs = await api.getAllTabs()
      expect(allTabs).toHaveLength(1)
      expect(allTabs[0]!.id).toBe(tab2.id)
    })

    it('does nothing if tab ID does not exist', async () => {
      await api.createTab(createTabDto({ name: 'Tab 1' }))

      await api.deleteTab('non-existent-id')

      const allTabs = await api.getAllTabs()
      expect(allTabs).toHaveLength(1)
    })

    it('simulates network delay', async () => {
      const createdTab = await api.createTab(createTabDto())
      const startTime = Date.now()
      await api.deleteTab(createdTab.id)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(200)
    })

    it('cascades delete to groups and bookmarks', async () => {
      const tab = await api.createTab(createTabDto({ name: 'Tab to delete' }))
      
      // Set up groups and bookmarks in localStorage
      localStorage.setItem('groups-mock-data', JSON.stringify([
        { id: 'group-1', tabId: tab.id },
        { id: 'group-2', tabId: 'other-tab-id' }
      ]))
      localStorage.setItem('bookmarks-mock-data', JSON.stringify([
        { id: 'bookmark-1', tabId: tab.id },
        { id: 'bookmark-2', tabId: 'other-tab-id' }
      ]))

      await api.deleteTab(tab.id)

      const groups = JSON.parse(localStorage.getItem('groups-mock-data') || '[]')
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks-mock-data') || '[]')
      
      expect(groups).toHaveLength(1)
      expect(groups[0]!.tabId).toBe('other-tab-id')
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0]!.tabId).toBe('other-tab-id')
    })
  })

  describe('clearStorage', () => {
    it('clears all stored tabs', async () => {
      await api.createTab(createTabDto({ name: 'Tab 1' }))
      await api.createTab(createTabDto({ name: 'Tab 2' }))

      api.clearStorage()

      const result = await api.getAllTabs()
      expect(result).toEqual([])
    })
  })

  describe('localStorage persistence', () => {
    it('persists across API instances', async () => {
      await api.createTab(createTabDto({ name: 'Persisted' }))

      const newApi = new MockTabApi()
      const result = await newApi.getAllTabs()

      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Persisted')
    })

    it('handles corrupted localStorage data gracefully', async () => {
      localStorage.setItem('tabs-mock-data', 'invalid json')

      const result = await api.getAllTabs()

      expect(result).toEqual([])
      expect(localStorage.getItem('tabs-mock-data')).toBeNull()
    })

    it('handles SSR (window undefined)', async () => {
      const originalWindow = global.window
      // @ts-expect-error - intentionally setting to undefined for SSR test
      global.window = undefined

      const ssrApi = new MockTabApi()
      const result = await ssrApi.getAllTabs()

      expect(result).toEqual([])

      global.window = originalWindow
    })
  })
})

