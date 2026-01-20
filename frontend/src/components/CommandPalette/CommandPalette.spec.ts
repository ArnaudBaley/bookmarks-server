import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia } from '@/test-utils'
import CommandPalette from './CommandPalette.vue'
import { useTabStore } from '@/stores/tab/tab'
import { bookmarkApi } from '@/services/bookmarkApi/bookmarkApi'
import type { Tab } from '@/types/tab'
import type { Bookmark } from '@/types/bookmark'

// Mock the bookmark API
vi.mock('@/services/bookmarkApi/bookmarkApi', () => ({
  bookmarkApi: {
    getAllBookmarks: vi.fn(),
  },
}))

describe('CommandPalette', () => {
  const mockOnFoldAllGroups = vi.fn()
  const mockOnUnfoldAllGroups = vi.fn()
  const mockOnCreateBookmark = vi.fn()
  const mockOnCreateGroup = vi.fn()
  const mockOnCreateTab = vi.fn()
  const mockOnBackupData = vi.fn()

  const defaultProps = {
    onFoldAllGroups: mockOnFoldAllGroups,
    onUnfoldAllGroups: mockOnUnfoldAllGroups,
    onCreateBookmark: mockOnCreateBookmark,
    onCreateGroup: mockOnCreateGroup,
    onCreateTab: mockOnCreateTab,
    onBackupData: mockOnBackupData,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    createTestPinia()
    const tabStore = useTabStore()
    
    // Set up default tabs
    tabStore.tabs = [
      {
        id: 'tab-1',
        name: 'Test Tab',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Tab,
    ]

    // Mock bookmark API
    vi.mocked(bookmarkApi.getAllBookmarks).mockResolvedValue([
      {
        id: 'bookmark-1',
        name: 'Test Bookmark',
        url: 'https://example.com',
        tabId: 'tab-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Bookmark,
    ])
  })

  it('renders command palette modal', () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe(
      'Search actions, tabs and bookmarks...'
    )
  })

  it('shows all actions when query is empty', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100)) // Wait for async operations

    const results = wrapper.findAll('li')
    // Should show 6 actions
    expect(results.length).toBeGreaterThanOrEqual(6)
  })

  it('filters actions by query', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('bookmark')

    await wrapper.vm.$nextTick()

    // Should show "Create new bookmark" action
    expect(wrapper.text()).toContain('Create new bookmark')
  })

  it('executes fold all groups action', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('fold')

    await wrapper.vm.$nextTick()

    // Find and click the fold action
    const allItems = wrapper.findAll('li')
    const foldAction = allItems.find((item) => item.text().includes('Fold all groups'))
    expect(foldAction).toBeDefined()
    await foldAction!.trigger('click')

    expect(mockOnFoldAllGroups).toHaveBeenCalledTimes(1)
  })

  it('executes unfold all groups action', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('unfold')

    await wrapper.vm.$nextTick()

    const allItems = wrapper.findAll('li')
    const unfoldAction = allItems.find((item) => item.text().includes('Unfold all groups'))
    expect(unfoldAction).toBeDefined()
    await unfoldAction!.trigger('click')

    expect(mockOnUnfoldAllGroups).toHaveBeenCalledTimes(1)
  })

  it('executes create bookmark action', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('bookmark')

    await wrapper.vm.$nextTick()

    const allItems = wrapper.findAll('li')
    const createBookmarkAction = allItems.find((item) => item.text().includes('Create new bookmark'))
    expect(createBookmarkAction).toBeDefined()
    await createBookmarkAction!.trigger('click')

    expect(mockOnCreateBookmark).toHaveBeenCalledTimes(1)
  })

  it('executes create group action', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('group')

    await wrapper.vm.$nextTick()

    const allItems = wrapper.findAll('li')
    const createGroupAction = allItems.find((item) => item.text().includes('Create new group'))
    expect(createGroupAction).toBeDefined()
    await createGroupAction!.trigger('click')

    expect(mockOnCreateGroup).toHaveBeenCalledTimes(1)
  })

  it('executes create tab action', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('tab')

    await wrapper.vm.$nextTick()

    const allItems = wrapper.findAll('li')
    const createTabAction = allItems.find((item) => item.text().includes('Create new tab'))
    expect(createTabAction).toBeDefined()
    await createTabAction!.trigger('click')

    expect(mockOnCreateTab).toHaveBeenCalledTimes(1)
  })

  it('executes backup data action', async () => {
    const pinia = createTestPinia()
    mockOnBackupData.mockResolvedValue(undefined)
    
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('backup')

    await wrapper.vm.$nextTick()

    const allItems = wrapper.findAll('li')
    const backupAction = allItems.find((item) => item.text().includes('Backup user data'))
    expect(backupAction).toBeDefined()
    await backupAction!.trigger('click')

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockOnBackupData).toHaveBeenCalledTimes(1)
  })

  it('searches for tabs', async () => {
    const pinia = createTestPinia()
    const tabStore = useTabStore()
    
    // Ensure tab is in store
    tabStore.tabs = [
      {
        id: 'tab-1',
        name: 'Test Tab',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Tab,
    ]

    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    // Wait for component to mount and fetch bookmarks
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 200))

    const input = wrapper.find('input[type="text"]')
    // Use a more specific query that won't match actions
    await input.setValue('Test Tab')

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check if the tab appears in results (it should be there even if actions are shown first)
    const allItems = wrapper.findAll('li')
    const tabResult = allItems.find((item) => {
      const text = item.text()
      return text.includes('Test Tab') && !text.includes('Create new tab')
    })
    expect(tabResult).toBeDefined()
  })

  it('searches for bookmarks', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    // Wait for component to mount and fetch bookmarks
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 200))

    const input = wrapper.find('input[type="text"]')
    await input.setValue('Test Bookmark')

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check if the bookmark appears in results
    const allItems = wrapper.findAll('li')
    const bookmarkResult = allItems.find((item) => item.text().includes('Test Bookmark'))
    expect(bookmarkResult).toBeDefined()
  })

  it('closes on escape key', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    // Wait for component to mount and set up event listeners
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Simulate Escape key press on the window (as the component listens to window events)
    const escapeEvent = new KeyboardEvent('keydown', { 
      key: 'Escape', 
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(escapeEvent)

    // Wait for event to be processed
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('closes when clicking outside', async () => {
    const pinia = createTestPinia()
    const wrapper = mount(CommandPalette, {
      global: {
        plugins: [pinia],
      },
      props: defaultProps,
    })

    await wrapper.vm.$nextTick()

    const backdrop = wrapper.find('.fixed.inset-0')
    await backdrop.trigger('click.self')

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
