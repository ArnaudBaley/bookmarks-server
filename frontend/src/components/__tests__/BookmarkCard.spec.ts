import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BookmarkCard from '../BookmarkCard.vue'
import { createBookmark, mockWindowOpen } from '@/test-utils'

describe('BookmarkCard', () => {
  let mockOpen: ReturnType<typeof mockWindowOpen>

  beforeEach(() => {
    mockOpen = mockWindowOpen()
    // Mock window.confirm to return true by default
    window.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders bookmark name correctly', () => {
    const bookmark = createBookmark({ name: 'Test Bookmark', url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    expect(wrapper.text()).toContain('Test Bookmark')
  })

  it('renders bookmark icon with correct favicon URL', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toContain('google.com/s2/favicons')
    expect(img.attributes('src')).toContain('example.com')
    expect(img.attributes('alt')).toBe('Test Bookmark icon')
  })

  it('opens URL in new window when icon is clicked', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const iconContainer = wrapper.find('[role="button"]')
    iconContainer.trigger('click')

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('opens URL when Enter key is pressed on icon', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const iconContainer = wrapper.find('[role="button"]')
    iconContainer.trigger('keyup.enter')

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('emits delete event when delete button is clicked and confirmed', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete bookmark"]')
    await deleteButton.trigger('click')

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Test Bookmark"?')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual(['test-id'])
  })

  it('does not emit delete event when confirmation is cancelled', async () => {
    window.confirm = vi.fn(() => false)
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete bookmark"]')
    await deleteButton.trigger('click')

    expect(window.confirm).toHaveBeenCalled()
    expect(wrapper.emitted('delete')).toBeFalsy()
  })

  it('handles invalid URLs in getFaviconUrl by returning default favicon', () => {
    const bookmark = createBookmark({ url: 'invalid-url' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('/favicon.ico')
  })

  it('handles URLs without protocol in getFaviconUrl', () => {
    // This shouldn't happen in practice, but test edge case
    const bookmark = createBookmark({ url: '//example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const img = wrapper.find('img')
    // Should handle the URL parsing gracefully
    expect(img.exists()).toBe(true)
  })

  it('renders delete button with correct aria-label', () => {
    const bookmark = createBookmark()
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const deleteButton = wrapper.find('button[aria-label="Delete bookmark"]')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.text()).toBe('Delete')
  })

  it('has correct CSS classes for styling', () => {
    const bookmark = createBookmark()
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('div')
    expect(card.classes()).toContain('flex')
    expect(card.classes()).toContain('flex-col')
  })
})

