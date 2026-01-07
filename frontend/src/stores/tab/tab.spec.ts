import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestPinia } from '@/test-utils'
import { useTabStore } from './tab'
import { createTab, createTabArray, createTabDto } from '@/test-utils'
import * as tabApiModule from '@/services/tabApi/tabApi'
import type { Tab } from '@/types/tab'

describe('Tab Store', () => {
  let store: ReturnType<typeof useTabStore>

  beforeEach(() => {
    createTestPinia()
    store = useTabStore()
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('has empty tabs array', () => {
      expect(store.tabs).toEqual([])
    })

    it('has activeTabId set to null', () => {
      expect(store.activeTabId).toBe(null)
    })

    it('has loading set to false', () => {
      expect(store.loading).toBe(false)
    })

    it('has error set to null', () => {
      expect(store.error).toBe(null)
    })
  })

  describe('tabsCount computed', () => {
    it('returns 0 when no tabs', () => {
      expect(store.tabsCount).toBe(0)
    })

    it('returns correct count when tabs exist', () => {
      store.tabs = createTabArray(3)
      expect(store.tabsCount).toBe(3)
    })

    it('updates when tabs are added', () => {
      expect(store.tabsCount).toBe(0)
      store.tabs.push(createTab())
      expect(store.tabsCount).toBe(1)
    })
  })

  describe('activeTab computed', () => {
    it('returns null when no activeTabId is set', () => {
      store.tabs = createTabArray(2)
      expect(store.activeTab).toBe(null)
    })

    it('returns the active tab when activeTabId is set', () => {
      const tabs = createTabArray(2)
      store.tabs = tabs
      store.activeTabId = tabs[0]!.id
      expect(store.activeTab).toEqual(tabs[0])
    })

    it('returns null when activeTabId does not match any tab', () => {
      store.tabs = createTabArray(2)
      store.activeTabId = 'non-existent-id'
      expect(store.activeTab).toBe(null)
    })
  })

  describe('getTabById computed', () => {
    it('returns undefined when tab not found', () => {
      store.tabs = createTabArray(2)
      expect(store.getTabById('non-existent-id')).toBeUndefined()
    })

    it('returns the tab when found', () => {
      const tabs = createTabArray(2)
      store.tabs = tabs
      expect(store.getTabById(tabs[0]!.id)).toEqual(tabs[0])
    })
  })

  describe('fetchTabs', () => {
    it('fetches tabs successfully', async () => {
      const mockTabs = createTabArray(2)
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)

      await store.fetchTabs()

      expect(store.tabs).toEqual(mockTabs)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets activeTabId to first tab when none is set and tabs exist', async () => {
      const mockTabs = createTabArray(2)
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)

      await store.fetchTabs()

      expect(store.activeTabId).toBe(mockTabs[0]!.id)
    })

    it('does not change activeTabId when already set', async () => {
      const mockTabs = createTabArray(2)
      store.activeTabId = 'existing-tab-id'
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)

      await store.fetchTabs()

      expect(store.activeTabId).toBe('existing-tab-id')
    })

    it('does not set activeTabId when no tabs are returned', async () => {
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue([])

      await store.fetchTabs()

      expect(store.activeTabId).toBe(null)
    })

    it('sets loading to true during fetch', async () => {
      let resolvePromise: (value: Tab[]) => void
      const promise = new Promise<Tab[]>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockReturnValue(promise)

      const fetchPromise = store.fetchTabs()
      expect(store.loading).toBe(true)

      resolvePromise!(createTabArray(1))
      await fetchPromise

      expect(store.loading).toBe(false)
    })

    it('handles fetch error', async () => {
      const errorMessage = 'Failed to fetch tabs'
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockRejectedValue(new Error(errorMessage))

      await store.fetchTabs()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.tabs).toEqual([])
    })

    it('handles non-Error exceptions', async () => {
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockRejectedValue('String error')

      await store.fetchTabs()

      expect(store.error).toBe('Failed to fetch tabs')
      expect(store.loading).toBe(false)
    })

    it('clears error before fetching', async () => {
      store.error = 'Previous error'
      const mockTabs = createTabArray(1)
      vi.spyOn(tabApiModule.tabApi, 'getAllTabs').mockResolvedValue(mockTabs)

      await store.fetchTabs()

      expect(store.error).toBe(null)
    })
  })

  describe('addTab', () => {
    it('adds tab successfully', async () => {
      const newTab = createTab({ id: 'new-id', name: 'New Tab' })
      const tabDto = createTabDto({ name: 'New Tab' })

      vi.spyOn(tabApiModule.tabApi, 'createTab').mockResolvedValue(newTab)

      const result = await store.addTab(tabDto)

      expect(result).toEqual(newTab)
      expect(store.tabs).toContainEqual(newTab)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('sets activeTabId when it is the first tab', async () => {
      const newTab = createTab({ id: 'first-tab-id' })
      const tabDto = createTabDto()
      vi.spyOn(tabApiModule.tabApi, 'createTab').mockResolvedValue(newTab)

      await store.addTab(tabDto)

      expect(store.activeTabId).toBe('first-tab-id')
    })

    it('does not change activeTabId when tabs already exist', async () => {
      store.tabs = createTabArray(1)
      store.activeTabId = store.tabs[0]!.id
      const newTab = createTab({ id: 'second-tab-id' })
      const tabDto = createTabDto()
      vi.spyOn(tabApiModule.tabApi, 'createTab').mockResolvedValue(newTab)

      await store.addTab(tabDto)

      expect(store.activeTabId).not.toBe('second-tab-id')
    })

    it('sets loading to true during add', async () => {
      let resolvePromise: (value: Tab) => void
      const promise = new Promise<Tab>((resolve) => {
        resolvePromise = resolve
      })
      const tabDto = createTabDto()
      vi.spyOn(tabApiModule.tabApi, 'createTab').mockReturnValue(promise)

      const addPromise = store.addTab(tabDto)
      expect(store.loading).toBe(true)

      resolvePromise!(createTab())
      await addPromise

      expect(store.loading).toBe(false)
    })

    it('handles add error and throws', async () => {
      const errorMessage = 'Failed to create tab'
      const tabDto = createTabDto()
      vi.spyOn(tabApiModule.tabApi, 'createTab').mockRejectedValue(new Error(errorMessage))

      await expect(store.addTab(tabDto)).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.tabs).toEqual([])
    })

    it('handles non-Error exceptions', async () => {
      const tabDto = createTabDto()
      vi.spyOn(tabApiModule.tabApi, 'createTab').mockRejectedValue('String error')

      await expect(store.addTab(tabDto)).rejects.toBe('String error')

      expect(store.error).toBe('Failed to create tab')
    })

    it('clears error before adding', async () => {
      store.error = 'Previous error'
      const newTab = createTab()
      const tabDto = createTabDto()
      vi.spyOn(tabApiModule.tabApi, 'createTab').mockResolvedValue(newTab)

      await store.addTab(tabDto)

      expect(store.error).toBe(null)
    })
  })

  describe('updateTab', () => {
    it('updates tab successfully', async () => {
      const existingTab = createTab({ id: 'tab-1', name: 'Original Name' })
      store.tabs = [existingTab]
      const updatedTab = createTab({ id: 'tab-1', name: 'Updated Name' })
      vi.spyOn(tabApiModule.tabApi, 'updateTab').mockResolvedValue(updatedTab)

      const result = await store.updateTab('tab-1', { name: 'Updated Name' })

      expect(result).toEqual(updatedTab)
      expect(store.tabs[0]).toEqual(updatedTab)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('does not update if tab not found in store', async () => {
      const updatedTab = createTab({ id: 'tab-1', name: 'Updated Name' })
      vi.spyOn(tabApiModule.tabApi, 'updateTab').mockResolvedValue(updatedTab)

      await store.updateTab('non-existent-id', { name: 'Updated Name' })

      expect(store.tabs).toEqual([])
    })

    it('sets loading to true during update', async () => {
      const existingTab = createTab({ id: 'tab-1' })
      store.tabs = [existingTab]
      let resolvePromise: (value: Tab) => void
      const promise = new Promise<Tab>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(tabApiModule.tabApi, 'updateTab').mockReturnValue(promise)

      const updatePromise = store.updateTab('tab-1', { name: 'Updated' })
      expect(store.loading).toBe(true)

      resolvePromise!(createTab({ id: 'tab-1' }))
      await updatePromise

      expect(store.loading).toBe(false)
    })

    it('handles update error and throws', async () => {
      const existingTab = createTab({ id: 'tab-1' })
      store.tabs = [existingTab]
      const errorMessage = 'Failed to update tab'
      vi.spyOn(tabApiModule.tabApi, 'updateTab').mockRejectedValue(new Error(errorMessage))

      await expect(store.updateTab('tab-1', { name: 'Updated' })).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
    })

    it('handles non-Error exceptions', async () => {
      const existingTab = createTab({ id: 'tab-1' })
      store.tabs = [existingTab]
      vi.spyOn(tabApiModule.tabApi, 'updateTab').mockRejectedValue('String error')

      await expect(store.updateTab('tab-1', { name: 'Updated' })).rejects.toBe('String error')

      expect(store.error).toBe('Failed to update tab')
    })

    it('clears error before updating', async () => {
      store.error = 'Previous error'
      const existingTab = createTab({ id: 'tab-1' })
      store.tabs = [existingTab]
      const updatedTab = createTab({ id: 'tab-1' })
      vi.spyOn(tabApiModule.tabApi, 'updateTab').mockResolvedValue(updatedTab)

      await store.updateTab('tab-1', { name: 'Updated' })

      expect(store.error).toBe(null)
    })
  })

  describe('removeTab', () => {
    it('removes tab successfully', async () => {
      const tab1 = createTab({ id: 'tab-1' })
      const tab2 = createTab({ id: 'tab-2' })
      store.tabs = [tab1, tab2]

      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockResolvedValue(undefined)

      await store.removeTab('tab-1')

      expect(store.tabs).toHaveLength(1)
      expect(store.tabs[0]!.id).toBe('tab-2')
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('switches to first available tab when active tab is removed', async () => {
      const tab1 = createTab({ id: 'tab-1' })
      const tab2 = createTab({ id: 'tab-2' })
      store.tabs = [tab1, tab2]
      store.activeTabId = 'tab-1'

      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockResolvedValue(undefined)

      await store.removeTab('tab-1')

      expect(store.activeTabId).toBe('tab-2')
    })

    it('sets activeTabId to null when last tab is removed', async () => {
      const tab1 = createTab({ id: 'tab-1' })
      store.tabs = [tab1]
      store.activeTabId = 'tab-1'

      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockResolvedValue(undefined)

      await store.removeTab('tab-1')

      expect(store.activeTabId).toBe(null)
    })

    it('does not change activeTabId when non-active tab is removed', async () => {
      const tab1 = createTab({ id: 'tab-1' })
      const tab2 = createTab({ id: 'tab-2' })
      store.tabs = [tab1, tab2]
      store.activeTabId = 'tab-1'

      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockResolvedValue(undefined)

      await store.removeTab('tab-2')

      expect(store.activeTabId).toBe('tab-1')
    })

    it('sets loading to true during remove', async () => {
      const tab = createTab({ id: 'tab-1' })
      store.tabs = [tab]

      let resolvePromise: () => void
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockReturnValue(promise)

      const removePromise = store.removeTab('tab-1')
      expect(store.loading).toBe(true)

      resolvePromise!()
      await removePromise

      expect(store.loading).toBe(false)
    })

    it('handles remove error and throws', async () => {
      const tab = createTab({ id: 'tab-1' })
      store.tabs = [tab]
      const errorMessage = 'Failed to delete tab'

      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockRejectedValue(new Error(errorMessage))

      await expect(store.removeTab('tab-1')).rejects.toThrow()

      expect(store.error).toBe(errorMessage)
      expect(store.loading).toBe(false)
      expect(store.tabs).toHaveLength(1) // Tab should not be removed on error
    })

    it('handles non-Error exceptions', async () => {
      const tab = createTab({ id: 'tab-1' })
      store.tabs = [tab]

      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockRejectedValue('String error')

      await expect(store.removeTab('tab-1')).rejects.toBe('String error')

      expect(store.error).toBe('Failed to delete tab')
    })

    it('clears error before removing', async () => {
      store.error = 'Previous error'
      const tab = createTab({ id: 'tab-1' })
      store.tabs = [tab]

      vi.spyOn(tabApiModule.tabApi, 'deleteTab').mockResolvedValue(undefined)

      await store.removeTab('tab-1')

      expect(store.error).toBe(null)
    })
  })

  describe('setActiveTab', () => {
    it('sets activeTabId', () => {
      store.setActiveTab('new-tab-id')
      expect(store.activeTabId).toBe('new-tab-id')
    })

    it('can set activeTabId to null', () => {
      store.activeTabId = 'existing-id'
      store.setActiveTab(null)
      expect(store.activeTabId).toBe(null)
    })
  })
})

