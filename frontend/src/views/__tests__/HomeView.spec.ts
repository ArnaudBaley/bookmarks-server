import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia, mountWithPinia, createBookmark, createBookmarkArray } from '@/test-utils'
import HomeView from '../HomeView.vue'
import { useBookmarkStore } from '@/stores/bookmark/bookmark'
import { useGroupStore } from '@/stores/group/group'
import { useTabStore } from '@/stores/tab/tab'
import { MockBookmarkApi } from '@/services/bookmarkApi/bookmarkApi.mock'

describe('HomeView', () => {
  let mockApi: MockBookmarkApi

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    // Create a fresh mock API instance
    mockApi = new MockBookmarkApi()
    mockApi.clearStorage()
  })

  // Helper function to set up tabs in tests
  function setupTabs() {
    const tabStore = useTabStore()
    tabStore.tabs = [
      { id: 'test-tab-id', name: 'Test Tab', color: '#3b82f6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
    tabStore.activeTabId = 'test-tab-id'
    vi.spyOn(tabStore, 'fetchTabs').mockResolvedValue(undefined)
    return tabStore
  }

  it('fetches bookmarks on mount', async () => {
    // Create Pinia instance and store before mounting
    const pinia = createTestPinia()
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()
    setupTabs()
    const fetchBookmarksSpy = vi.spyOn(bookmarkStore, 'fetchBookmarks').mockResolvedValue(undefined)
    const fetchGroupsSpy = vi.spyOn(groupStore, 'fetchGroups').mockResolvedValue(undefined)

    // Now mount the component
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })

    // Wait for onMounted to execute
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(fetchBookmarksSpy).toHaveBeenCalledTimes(1)
    expect(fetchGroupsSpy).toHaveBeenCalledTimes(1)
  })

  it('displays loading state when bookmarks are being fetched', async () => {
    const pinia = createTestPinia()
    setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()

    // Set loading state
    bookmarkStore.loading = true
    bookmarkStore.bookmarks = []
    groupStore.loading = false
    groupStore.groups = []

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Loading bookmarks...')
  })

  it('displays error state with retry button when fetch fails', async () => {
    const pinia = createTestPinia()
    setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()

    bookmarkStore.error = 'Failed to fetch bookmarks'
    bookmarkStore.bookmarks = []
    bookmarkStore.loading = false
    groupStore.groups = []
    groupStore.loading = false
    groupStore.error = null

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Error: Failed to fetch bookmarks')
    // Find the retry button specifically (not the theme toggle or add button)
    const buttons = wrapper.findAll('button')
    const retryButton = buttons.find((btn) => btn.text() === 'Retry')
    expect(retryButton).toBeDefined()
    expect(retryButton?.text()).toBe('Retry')
  })

  it('calls fetchBookmarks when retry button is clicked', async () => {
    const pinia = createTestPinia()
    setupTabs()
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()
    
    // Clear any initial calls from mount
    const fetchBookmarksSpy = vi.spyOn(bookmarkStore, 'fetchBookmarks').mockClear()
    const fetchGroupsSpy = vi.spyOn(groupStore, 'fetchGroups').mockClear()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })

    bookmarkStore.error = 'Failed to fetch bookmarks'
    bookmarkStore.bookmarks = []
    bookmarkStore.loading = false
    groupStore.groups = []
    groupStore.loading = false
    groupStore.error = null

    await wrapper.vm.$nextTick()
    
    // Clear calls from mount/watchers
    fetchBookmarksSpy.mockClear()
    fetchGroupsSpy.mockClear()

    // Find the retry button specifically
    const buttons = wrapper.findAll('button')
    const retryButton = buttons.find((btn) => btn.text() === 'Retry')
    expect(retryButton).toBeDefined()
    await retryButton!.trigger('click')

    expect(fetchBookmarksSpy).toHaveBeenCalledTimes(1)
    expect(fetchGroupsSpy).toHaveBeenCalledTimes(1)
  })

  it('displays empty state message when no bookmarks exist', async () => {
    const pinia = createTestPinia()
    setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()

    bookmarkStore.bookmarks = []
    bookmarkStore.loading = false
    bookmarkStore.error = null
    groupStore.groups = []
    groupStore.loading = false
    groupStore.error = null

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No bookmarks yet. Click the + button to add your first bookmark!')
  })

  it('renders bookmark cards when bookmarks exist', async () => {
    const pinia = createTestPinia()
    const tabStore = setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const bookmarkStore = useBookmarkStore()
    const groupStore = useGroupStore()

    const bookmarks = createBookmarkArray(3).map(b => ({ ...b, tabId: tabStore.activeTabId! }))
    bookmarkStore.bookmarks = bookmarks
    bookmarkStore.loading = false
    bookmarkStore.error = null
    groupStore.groups = []
    groupStore.loading = false
    groupStore.error = null

    await wrapper.vm.$nextTick()

    const bookmarkCards = wrapper.findAllComponents({ name: 'BookmarkCard' })
    expect(bookmarkCards.length).toBe(3)
  })

  it('shows AddBookmarkForm when + button is clicked', async () => {
    const wrapper = mountWithPinia(HomeView)

    const addButton = wrapper.find('button[aria-label="Add new bookmark"]')
    await addButton.trigger('click')

    await wrapper.vm.$nextTick()

    const form = wrapper.findComponent({ name: 'AddBookmarkForm' })
    expect(form.exists()).toBe(true)
  })

  it('hides AddBookmarkForm initially', () => {
    const wrapper = mountWithPinia(HomeView)

    const form = wrapper.findComponent({ name: 'AddBookmarkForm' })
    expect(form.exists()).toBe(false)
  })

  it('hides AddBookmarkForm when cancel event is emitted', async () => {
    const wrapper = mountWithPinia(HomeView)

    // Show form
    const addButton = wrapper.find('button[aria-label="Add new bookmark"]')
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Cancel form
    const form = wrapper.findComponent({ name: 'AddBookmarkForm' })
    await form.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    const formAfterCancel = wrapper.findComponent({ name: 'AddBookmarkForm' })
    expect(formAfterCancel.exists()).toBe(false)
  })

  it('handles add bookmark success and hides form', async () => {
    const pinia = createTestPinia()
    const tabStore = setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const store = useBookmarkStore()

    const addBookmarkSpy = vi.spyOn(store, 'addBookmark').mockResolvedValue(createBookmark())

    // Show form
    const addButton = wrapper.find('button[aria-label="Add new bookmark"]')
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Submit form
    const form = wrapper.findComponent({ name: 'AddBookmarkForm' })
    await form.vm.$emit('submit', { name: 'Test', url: 'https://example.com' })
    await wrapper.vm.$nextTick()

    expect(addBookmarkSpy).toHaveBeenCalledWith({ name: 'Test', url: 'https://example.com', tabId: tabStore.activeTabId })

    // Form should be hidden after successful submission
    const formAfterSubmit = wrapper.findComponent({ name: 'AddBookmarkForm' })
    expect(formAfterSubmit.exists()).toBe(false)
  })

  it('handles add bookmark error without hiding form', async () => {
    const pinia = createTestPinia()
    setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const store = useBookmarkStore()

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const addBookmarkSpy = vi
      .spyOn(store, 'addBookmark')
      .mockRejectedValue(new Error('Failed to add bookmark'))

    // Show form
    const addButton = wrapper.find('button[aria-label="Add new bookmark"]')
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()

    // Submit form
    const form = wrapper.findComponent({ name: 'AddBookmarkForm' })
    await form.vm.$emit('submit', { name: 'Test', url: 'https://example.com' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick() // Wait for error handling

    expect(addBookmarkSpy).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('shows EditBookmarkForm when modify event is emitted', async () => {
    const pinia = createTestPinia()
    const tabStore = setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const store = useBookmarkStore()

    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark', tabId: tabStore.activeTabId! })
    store.bookmarks = [bookmark]
    await wrapper.vm.$nextTick()

    const bookmarkCard = wrapper.findComponent({ name: 'BookmarkCard' })
    await bookmarkCard.vm.$emit('modify', bookmark)
    await wrapper.vm.$nextTick()

    const editForm = wrapper.findComponent({ name: 'EditBookmarkForm' })
    expect(editForm.exists()).toBe(true)
    expect(editForm.props('bookmark')).toEqual(bookmark)
  })

  it('handles update bookmark success and hides form', async () => {
    const pinia = createTestPinia()
    const tabStore = setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const store = useBookmarkStore()

    const updateBookmarkSpy = vi.spyOn(store, 'updateBookmark').mockResolvedValue(createBookmark())

    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark', tabId: tabStore.activeTabId! })
    store.bookmarks = [bookmark]
    await wrapper.vm.$nextTick()

    // Open edit form
    const bookmarkCard = wrapper.findComponent({ name: 'BookmarkCard' })
    await bookmarkCard.vm.$emit('modify', bookmark)
    await wrapper.vm.$nextTick()

    // Submit edit form
    const editForm = wrapper.findComponent({ name: 'EditBookmarkForm' })
    await editForm.vm.$emit('submit', 'test-id', { name: 'Updated Bookmark', url: 'https://example.com' })
    await wrapper.vm.$nextTick()

    expect(updateBookmarkSpy).toHaveBeenCalledWith('test-id', { name: 'Updated Bookmark', url: 'https://example.com' })

    // Form should be hidden after successful submission
    const formAfterSubmit = wrapper.findComponent({ name: 'EditBookmarkForm' })
    expect(formAfterSubmit.exists()).toBe(false)
  })

  it('handles delete from edit form success', async () => {
    const pinia = createTestPinia()
    const tabStore = setupTabs()
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })
    const store = useBookmarkStore()

    const removeBookmarkSpy = vi.spyOn(store, 'removeBookmark').mockResolvedValue(undefined)

    const bookmark = createBookmark({ id: 'test-id', tabId: tabStore.activeTabId! })
    store.bookmarks = [bookmark]
    await wrapper.vm.$nextTick()

    // Open edit form
    const bookmarkCard = wrapper.findComponent({ name: 'BookmarkCard' })
    await bookmarkCard.vm.$emit('modify', bookmark)
    await wrapper.vm.$nextTick()

    // Delete from edit form
    const editForm = wrapper.findComponent({ name: 'EditBookmarkForm' })
    await editForm.vm.$emit('delete', 'test-id')
    await wrapper.vm.$nextTick()

    expect(removeBookmarkSpy).toHaveBeenCalledWith('test-id')

    // Form should be hidden after deletion
    const formAfterDelete = wrapper.findComponent({ name: 'EditBookmarkForm' })
    expect(formAfterDelete.exists()).toBe(false)
  })

  it('displays correct page title', () => {
    const wrapper = mountWithPinia(HomeView)

    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('My Bookmarks')
  })
})

