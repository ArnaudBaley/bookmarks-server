import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BookmarkCard from './BookmarkCard.vue'
import { createBookmark, mockWindowOpen } from '@/test-utils'

describe('BookmarkCard', () => {
  let mockOpen: ReturnType<typeof mockWindowOpen>

  beforeEach(() => {
    mockOpen = mockWindowOpen()
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

  it('opens URL in new window when card is clicked', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    card.trigger('click')

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('opens URL when Enter key is pressed on card', () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    card.trigger('keyup.enter')

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  it('emits modify event when modify button is clicked', async () => {
    const bookmark = createBookmark({ id: 'test-id', name: 'Test Bookmark' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const modifyButton = wrapper.find('button[aria-label="Modify bookmark"]')
    await modifyButton.trigger('click')

    expect(wrapper.emitted('modify')).toBeTruthy()
    expect(wrapper.emitted('modify')?.[0]).toEqual([bookmark])
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

  it('renders modify button with correct aria-label', () => {
    const bookmark = createBookmark()
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const modifyButton = wrapper.find('button[aria-label="Modify bookmark"]')
    expect(modifyButton.exists()).toBe(true)
    // Check that it contains an SVG (the three dots icon)
    const svg = modifyButton.find('svg')
    expect(svg.exists()).toBe(true)
  })

  it('has correct CSS classes for styling', () => {
    const bookmark = createBookmark()
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const card = wrapper.find('[role="button"]')
    expect(card.classes()).toContain('flex')
    expect(card.classes()).toContain('flex-row')
  })

  it('does not open URL when modify button is clicked', async () => {
    const bookmark = createBookmark({ url: 'https://example.com' })
    const wrapper = mount(BookmarkCard, {
      props: { bookmark },
    })

    const modifyButton = wrapper.find('button[aria-label="Modify bookmark"]')
    await modifyButton.trigger('click')

    // Should not have opened the URL
    expect(mockOpen).not.toHaveBeenCalled()
    // But should have emitted modify event
    expect(wrapper.emitted('modify')).toBeTruthy()
  })
})

