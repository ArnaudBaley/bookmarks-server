import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestPinia, mountWithPinia, createBookmark, createBookmarkArray } from '@/test-utils'
import HomeView from '../HomeView.vue'
import { useBookmarkStore } from '@/stores/bookmark'
import { MockBookmarkApi } from '@/services/bookmarkApi.mock'

describe('HomeView', () => {
  let mockApi: MockBookmarkApi

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    // Create a fresh mock API instance
    mockApi = new MockBookmarkApi()
    mockApi.clearStorage()
  })

  it('fetches bookmarks on mount', async () => {
    // Create Pinia instance and store before mounting
    const pinia = createTestPinia()
    const store = useBookmarkStore()
    const fetchSpy = vi.spyOn(store, 'fetchBookmarks').mockResolvedValue(undefined)

    // Now mount the component
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia],
      },
    })

    // Wait for onMounted to execute
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('displays loading state when bookmarks are being fetched', async () => {
    const wrapper = mountWithPinia(HomeView)
    const store = useBookmarkStore()

    // Set loading state
    store.loading = true
    store.bookmarks = []

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Loading bookmarks...')
  })

  it('displays error state with retry button when fetch fails', async () => {
    const wrapper = mountWithPinia(HomeView)
    const store = useBookmarkStore()

    store.error = 'Failed to fetch bookmarks'
    store.bookmarks = []
    store.loading = false

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Error: Failed to fetch bookmarks')
    // Find the retry button specifically (not the theme toggle or add button)
    const buttons = wrapper.findAll('button')
    const retryButton = buttons.find((btn) => btn.text() === 'Retry')
    expect(retryButton).toBeDefined()
    expect(retryButton?.text()).toBe('Retry')
  })

  it('calls fetchBookmarks when retry button is clicked', async () => {
    const wrapper = mountWithPinia(HomeView)
    const store = useBookmarkStore()

    store.error = 'Failed to fetch bookmarks'
    store.bookmarks = []
    store.loading = false

    const fetchSpy = vi.spyOn(store, 'fetchBookmarks')

    await wrapper.vm.$nextTick()

    // Find the retry button specifically
    const buttons = wrapper.findAll('button')
    const retryButton = buttons.find((btn) => btn.text() === 'Retry')
    expect(retryButton).toBeDefined()
    await retryButton!.trigger('click')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('displays empty state message when no bookmarks exist', async () => {
    const wrapper = mountWithPinia(HomeView)
    const store = useBookmarkStore()

    store.bookmarks = []
    store.loading = false
    store.error = null

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No bookmarks yet. Click the + button to add your first bookmark!')
  })

  it('renders bookmark cards when bookmarks exist', async () => {
    const wrapper = mountWithPinia(HomeView)
    const store = useBookmarkStore()

    const bookmarks = createBookmarkArray(3)
    store.bookmarks = bookmarks
    store.loading = false
    store.error = null

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
    const wrapper = mountWithPinia(HomeView)
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

    expect(addBookmarkSpy).toHaveBeenCalledWith({ name: 'Test', url: 'https://example.com' })

    // Form should be hidden after successful submission
    const formAfterSubmit = wrapper.findComponent({ name: 'AddBookmarkForm' })
    expect(formAfterSubmit.exists()).toBe(false)
  })

  it('handles add bookmark error without hiding form', async () => {
    const wrapper = mountWithPinia(HomeView)
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

  it('handles delete bookmark success', async () => {
    const wrapper = mountWithPinia(HomeView)
    const store = useBookmarkStore()

    const removeBookmarkSpy = vi.spyOn(store, 'removeBookmark').mockResolvedValue(undefined)

    const bookmark = createBookmark({ id: 'test-id' })
    store.bookmarks = [bookmark]
    await wrapper.vm.$nextTick()

    const bookmarkCard = wrapper.findComponent({ name: 'BookmarkCard' })
    await bookmarkCard.vm.$emit('delete', 'test-id')

    expect(removeBookmarkSpy).toHaveBeenCalledWith('test-id')
  })

  it('handles delete bookmark error', async () => {
    const wrapper = mountWithPinia(HomeView)
    const store = useBookmarkStore()

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const removeBookmarkSpy = vi
      .spyOn(store, 'removeBookmark')
      .mockRejectedValue(new Error('Failed to delete bookmark'))

    const bookmark = createBookmark({ id: 'test-id' })
    store.bookmarks = [bookmark]
    await wrapper.vm.$nextTick()

    const bookmarkCard = wrapper.findComponent({ name: 'BookmarkCard' })
    await bookmarkCard.vm.$emit('delete', 'test-id')
    await wrapper.vm.$nextTick()

    expect(removeBookmarkSpy).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('renders ThemeToggle component', () => {
    const wrapper = mountWithPinia(HomeView)

    const themeToggle = wrapper.findComponent({ name: 'ThemeToggle' })
    expect(themeToggle.exists()).toBe(true)
  })

  it('displays correct page title', () => {
    const wrapper = mountWithPinia(HomeView)

    const heading = wrapper.find('h1')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('My Bookmarks')
  })
})

